<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class TransferEnrollmentAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Move a student from one class to another class of the same subject.
     *
     * The old period is closed on the transfer date and a new one opens the same day,
     * so the student's history has no gap. Only classes teaching the same subject are
     * allowed as targets, because a transfer is meant to change the group, not what is
     * being studied.
     *
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(
        int $enrollmentId,
        int $targetClassId,
        string $leftAt,
        ?string $note = null,
    ): ActionResult {
        try {
            $enrollment = $this->enrollments->findById($enrollmentId);

            if (! $enrollment instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            $source = $enrollment->schoolClass;

            if ($source->status !== ClassStatus::Active) {
                throw new ActionError(
                    message: 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.',
                    code: AcademicError::ClassNotActive,
                );
            }

            if (! $enrollment->isActive()) {
                throw new ActionError(
                    message: 'Học sinh không còn học trong lớp này.',
                    code: AcademicError::EnrollmentNotActive,
                );
            }

            $target = $this->resolveTarget($source, $targetClassId);
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

            $moved = DB::transaction(function () use ($enrollment, $target, $movesOn, $note): ClassEnrollment {
                $this->enrollments->update($enrollment, [
                    'left_at' => $movesOn->toDateString(),
                    'note' => trim(
                        ($enrollment->note ? $enrollment->note."\n" : '')
                        ."[Chuyển sang lớp: {$target->code}]",
                    ),
                ]);

                return $this->enrollments->create([
                    'class_id' => $target->id,
                    'student_id' => $enrollment->student_id,
                    'enrolled_at' => $movesOn->toDateString(),
                    'note' => $note,
                ]);
            });

            return ActionResult::success($this->enrollments->findById((int) $moved->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Load the target class and refuse one that is finished or teaches another subject.
     */
    private function resolveTarget(SchoolClass $source, int $targetClassId): SchoolClass
    {
        $target = $this->classes->findById($targetClassId);

        if (! $target instanceof SchoolClass) {
            throw new ActionError(
                message: 'Không tìm thấy lớp học.',
                code: AcademicError::ClassNotFound,
            );
        }

        if ($target->status !== ClassStatus::Active) {
            throw new ActionError(
                message: 'Lớp học mới không ở trạng thái đang hoạt động.',
                code: AcademicError::TransferTargetNotActive,
            );
        }

        if ((int) $target->subject_id !== (int) $source->subject_id) {
            throw new ActionError(
                message: 'Chỉ được chuyển học sinh sang lớp cùng môn học.',
                code: AcademicError::TransferSubjectMismatch,
            );
        }

        return $target;
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
