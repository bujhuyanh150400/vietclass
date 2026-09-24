<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\ClassEnrollmentEventRepository;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\StudentRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class TransferEnrollmentAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassEnrollmentEventRepository $events,
        private readonly ClassRepository $classes,
        private readonly StudentRepository $students,
    ) {}

    /**
     * Move a student between active classes with the same grade and complete subject set.
     *
     * Class, student, and enrolment rows are locked while all state and capacity rules
     * are rechecked, then the old period closes as the new one opens on the same day.
     *
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(
        int $enrollmentId,
        int $targetClassId,
        string $leftAt,
        ?string $note = null,
        ?int $actorId = null,
    ): ActionResult {
        try {
            $initial = $this->enrollments->findById($enrollmentId);

            if (! $initial instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            $initialSourceId = (int) $initial->class_id;
            $initialStudentId = (int) $initial->student_id;
            $movedId = DB::transaction(function () use ($enrollmentId, $initialSourceId, $initialStudentId, $targetClassId, $leftAt, $note, $actorId): int {
                $classIds = array_values(array_unique([$initialSourceId, $targetClassId]));
                sort($classIds, SORT_NUMERIC);
                $lockedClasses = $this->classes->lockByIds($classIds)->keyBy('id');
                $lockedStudents = $this->students->lockByIds([$initialStudentId])->keyBy('profile_id');
                $enrollment = $this->enrollments->findByIdForUpdate($enrollmentId);

                if (! $enrollment instanceof ClassEnrollment) {
                    throw new ActionError(
                        message: 'Không tìm thấy bản ghi ghi danh.',
                        code: AcademicError::EnrollmentNotFound,
                    );
                }

                if (! $enrollment->isActive()) {
                    throw new ActionError(
                        message: 'Học sinh không còn học trong lớp này.',
                        code: AcademicError::EnrollmentNotActive,
                    );
                }

                if ((int) $enrollment->class_id !== $initialSourceId) {
                    throw new ActionError(
                        message: 'Bản ghi ghi danh đã thay đổi, vui lòng tải lại.',
                        code: AcademicError::EnrollmentNotActive,
                    );
                }

                $source = $lockedClasses->get($initialSourceId);
                $target = $lockedClasses->get($targetClassId);

                if (! $source instanceof SchoolClass || ! $target instanceof SchoolClass) {
                    throw new ActionError(
                        message: 'Không tìm thấy lớp học.',
                        code: AcademicError::ClassNotFound,
                    );
                }

                if ($source->status !== ClassStatus::Active) {
                    throw new ActionError(
                        message: 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.',
                        code: AcademicError::ClassNotActive,
                    );
                }

                if ($target->status !== ClassStatus::Active) {
                    throw new ActionError(
                        message: 'Lớp học mới không ở trạng thái đang hoạt động.',
                        code: AcademicError::TransferTargetNotActive,
                    );
                }

                $student = $lockedStudents->get($initialStudentId);
                if (! $student instanceof StudentProfile
                    || (int) $enrollment->student_id !== $initialStudentId) {
                    throw new ActionError(
                        message: 'Không tìm thấy học sinh.',
                        code: AcademicError::StudentNotFound,
                    );
                }

                if (! $student->profile?->user?->is_active) {
                    throw new ActionError(
                        message: 'Tài khoản học sinh đã bị khóa, không thể ghi danh.',
                        code: AcademicError::StudentAccountInactive,
                    );
                }

                $this->guardTargetSubjects($source, $target);
                if ($student->grade_level !== $target->grade_level) {
                    throw new ActionError(
                        message: 'Học sinh không cùng khối với lớp mới.',
                        code: AcademicError::StudentGradeMismatch,
                    );
                }

                $movesOn = CarbonImmutable::parse($leftAt);
                if ($movesOn->lessThan($enrollment->enrolled_at)) {
                    throw new ActionError(
                        message: 'Ngày chuyển lớp không thể trước ngày vào lớp ('
                            .$enrollment->enrolled_at->format('d/m/Y').').',
                        code: AcademicError::LeftBeforeEnrolled,
                    );
                }

                if ($movesOn->lessThan($target->start_at)) {
                    throw new ActionError(
                        message: 'Ngày vào lớp không thể trước ngày khai giảng ('
                            .$target->start_at->format('d/m/Y').').',
                        code: AcademicError::EnrollmentBeforeClassStart,
                    );
                }

                $this->guardTarget($target, (int) $enrollment->student_id);

                // TODO(lịch học): once the schedule module exists, refuse a transfer whose
                // target timetable clashes with another class the student still attends.

                $this->enrollments->update($enrollment, [
                    'left_at' => $movesOn->toDateString(),
                    'note' => trim(
                        ($enrollment->note ? $enrollment->note."\n" : '')
                        ."[Chuyển sang lớp: {$target->code}]",
                    ),
                ]);

                $targetEnrollment = $this->enrollments->create([
                    'class_id' => $target->id,
                    'student_id' => $enrollment->student_id,
                    'enrolled_at' => $movesOn->toDateString(),
                    'note' => $note,
                ]);
                $this->events->append(
                    enrollmentId: (int) $enrollment->id,
                    type: ClassEnrollmentEventType::TransferredOut,
                    effectiveOn: $movesOn,
                    actorId: $actorId,
                    note: "Chuyển sang lớp: {$target->code}.",
                    relatedEnrollmentId: (int) $targetEnrollment->id,
                );
                $this->events->append(
                    enrollmentId: (int) $targetEnrollment->id,
                    type: ClassEnrollmentEventType::TransferredIn,
                    effectiveOn: $movesOn,
                    actorId: $actorId,
                    note: $note,
                    relatedEnrollmentId: (int) $enrollment->id,
                );

                return (int) $targetEnrollment->id;
            });

            return ActionResult::success($this->enrollments->findById($movedId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Refuse transfers when the complete sets of assigned subject IDs differ.
     */
    private function guardTargetSubjects(SchoolClass $source, SchoolClass $target): void
    {
        $sourceSubjectIds = $source->subjects()->orderBy('subjects.id')->pluck('subjects.id')->all();
        $targetSubjectIds = $target->subjects()->orderBy('subjects.id')->pluck('subjects.id')->all();

        if ($sourceSubjectIds !== $targetSubjectIds) {
            throw new ActionError(
                message: 'Chỉ được chuyển học sinh sang lớp cùng môn học.',
                code: AcademicError::TransferSubjectMismatch,
            );
        }
    }

    /**
     * Refuse a target that is full or where the student already holds a place.
     */
    private function guardTarget(SchoolClass $target, int $studentId): void
    {
        if ($this->enrollments->findActive((int) $target->id, $studentId) instanceof ClassEnrollment) {
            throw new ActionError(
                message: 'Học sinh đang học trong lớp này rồi.',
                code: AcademicError::StudentAlreadyEnrolled,
            );
        }

        $enrolled = $this->classes->countActiveEnrollments((int) $target->id);

        if ($enrolled + 1 > $target->max_students) {
            throw new ActionError(
                message: "Lớp đã đạt sĩ số tối đa ({$enrolled}/{$target->max_students} học sinh), không thể thêm.",
                code: AcademicError::ClassFull,
            );
        }
    }
}
