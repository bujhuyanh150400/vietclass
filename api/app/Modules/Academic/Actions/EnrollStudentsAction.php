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

final class EnrollStudentsAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassEnrollmentEventRepository $events,
        private readonly StudentRepository $students,
    ) {}

    /**
     * Enrol one or more students into a class from the same join date.
     *
     * The class and students are locked while grade, duplicate, and batch-capacity rules
     * are rechecked; a student who left before may enrol again, but a partial batch never persists.
     *
     * @param  list<int>  $studentIds
     * @return ActionResult<list<ClassEnrollment>, AcademicError>
     */
    public function handle(
        int $classId,
        array $studentIds,
        string $enrolledAt,
        ?string $note = null,
        ?int $actorId = null,
    ): ActionResult {
        try {
            $created = DB::transaction(function () use ($classId, $studentIds, $enrolledAt, $note, $actorId): array {
                $class = $this->classes->findByIdForUpdate($classId);

                if (! $class instanceof SchoolClass) {
                    throw new ActionError(
                        message: 'Không tìm thấy lớp học.',
                        code: AcademicError::ClassNotFound,
                    );
                }

                if ($class->status !== ClassStatus::Active) {
                    throw new ActionError(
                        message: 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.',
                        code: AcademicError::ClassNotActive,
                    );
                }

                $joinsOn = CarbonImmutable::parse($enrolledAt);
                if ($joinsOn->lessThan($class->start_at)) {
                    throw new ActionError(
                        message: 'Ngày vào lớp không thể trước ngày khai giảng ('
                            .$class->start_at->format('d/m/Y').').',
                        code: AcademicError::EnrollmentBeforeClassStart,
                    );
                }

                $students = $this->resolveStudents($class, $studentIds);
                $this->guardCapacity($class, count($students));

                // TODO(lịch học): once the schedule module exists, refuse a student whose
                // timetable already has a session clashing with this class from $joinsOn.

                $created = [];
                foreach ($students as $student) {
                    $enrollment = $this->enrollments->create([
                        'class_id' => $classId,
                        'student_id' => $student->profile_id,
                        'enrolled_at' => $joinsOn->toDateString(),
                        'note' => $note,
                    ]);
                    $this->events->append(
                        enrollmentId: (int) $enrollment->id,
                        type: ClassEnrollmentEventType::Enrolled,
                        effectiveOn: $joinsOn,
                        actorId: $actorId,
                        note: $note,
                    );
                    $created[] = $enrollment;
                }

                return $created;
            });

            return ActionResult::success($created);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Refuse a batch that would take the class past its capacity.
     */
    private function guardCapacity(SchoolClass $class, int $adding): void
    {
        $enrolled = $this->classes->countActiveEnrollments((int) $class->id);

        if ($enrolled + $adding > $class->max_students) {
            throw new ActionError(
                message: "Lớp đã đạt sĩ số tối đa ({$enrolled}/{$class->max_students} học sinh), không thể thêm.",
                code: AcademicError::ClassFull,
            );
        }
    }

    /**
     * Lock every requested student and refuse missing, wrong-grade, or duplicate members.
     *
     * @param  list<int>  $studentIds
     * @return list<StudentProfile>
     */
    private function resolveStudents(SchoolClass $class, array $studentIds): array
    {
        $studentIds = array_values(array_unique(array_map('intval', $studentIds)));
        $lockedStudents = $this->students->lockByIds($studentIds)->keyBy('profile_id');
        $students = [];

        foreach ($studentIds as $studentId) {
            $student = $lockedStudents->get($studentId);

            if (! $student instanceof StudentProfile) {
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

            if ($student->grade_level->value !== $class->grade_level->value) {
                throw new ActionError(
                    message: "Học sinh {$student->profile->full_name} không cùng khối với lớp.",
                    code: AcademicError::StudentGradeMismatch,
                );
            }

            if ($this->enrollments->findActive((int) $class->id, (int) $student->profile_id) instanceof ClassEnrollment) {
                throw new ActionError(
                    message: "Học sinh {$student->profile->full_name} đang học trong lớp này rồi.",
                    code: AcademicError::StudentAlreadyEnrolled,
                );
            }

            $students[] = $student;
        }

        return $students;
    }
}
