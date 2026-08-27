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
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Repositories\StudentRepository;
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
        private readonly StudentRepository $students,
    ) {}

    /**
     * Enrol one or more students into a class from the same join date.
     *
     * Capacity is checked once for the whole batch, so a request that would overfill
     * the class is refused outright rather than partly applied. A student who left the
     * class before may be enrolled again; only a running enrolment blocks it.
     *
     * @param  list<int>  $studentIds
     * @return ActionResult<list<ClassEnrollment>, AcademicError>
     */
    public function handle(int $classId, array $studentIds, string $enrolledAt, ?string $note = null): ActionResult
    {
        try {
            $class = $this->classes->findById($classId);

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

            $this->guardCapacity($class, count($studentIds));

            $students = $this->resolveStudents($classId, $studentIds);

            // TODO(lịch học): once the schedule module exists, refuse a student whose
            // timetable already has a session clashing with this class from $joinsOn.

            $created = DB::transaction(fn (): array => array_map(
                fn (Student $student): ClassEnrollment => $this->enrollments->create([
                    'class_id' => $classId,
                    'student_id' => $student->id,
                    'enrolled_at' => $joinsOn->toDateString(),
                    'note' => $note,
                ]),
                $students,
            ));

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
     * Load every requested student and refuse any that is missing or already studying
     * in this class.
     *
     * @param  list<int>  $studentIds
     * @return list<Student>
     */
    private function resolveStudents(int $classId, array $studentIds): array
    {
        $students = [];

        foreach ($studentIds as $studentId) {
            $student = $this->students->findById($studentId);

            if (! $student instanceof Student) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicError::StudentNotFound,
                );
            }

            if ($this->enrollments->findActive($classId, (int) $student->id) instanceof ClassEnrollment) {
                throw new ActionError(
                    message: "Học sinh {$student->full_name} đang học trong lớp này rồi.",
                    code: AcademicError::StudentAlreadyEnrolled,
                );
            }

            $students[] = $student;
        }

        return $students;
    }
}
