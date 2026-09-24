<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListEnrollmentStudentOptionsAction
{
    /** Load the class, candidate query, and current headcount. */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * Return a paginated student projection with the reason each unavailable row is disabled.
     *
     * @return ActionResult<LengthAwarePaginator<int, StudentProfile>, AcademicError>
     */
    public function handle(int $classId, ListQuery $query): ActionResult
    {
        try {
            $class = $this->classes->findById($classId);
            if (! $class instanceof SchoolClass) {
                throw new ActionError(
                    message: 'Không tìm thấy lớp học.',
                    code: AcademicError::ClassNotFound,
                );
            }

            $students = $this->enrollments->paginateEnrollmentStudentOptions($query);
            $activeStudents = $this->classes->countActiveEnrollments($classId);

            foreach ($students->getCollection() as $student) {
                $student->setAttribute(
                    'disabled_reason',
                    $this->disabledReason($class, $student, $activeStudents),
                );
            }

            return ActionResult::success($students);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Return the first current rule that makes this student unavailable. */
    private function disabledReason(SchoolClass $class, StudentProfile $student, int $activeStudents): ?string
    {
        if ($class->status === ClassStatus::Ended) {
            return 'class_ended';
        }

        if ($student->profile->user === null) {
            return 'account_missing';
        }

        if (! $student->profile->user->is_active) {
            return 'account_inactive';
        }

        if ($student->grade_level !== $class->grade_level) {
            return 'grade_mismatch';
        }

        if ($student->activeEnrollments->contains(
            fn ($enrollment): bool => (int) $enrollment->class_id === (int) $class->id,
        )) {
            return 'already_enrolled';
        }

        if ($activeStudents >= $class->max_students) {
            return 'class_full';
        }

        return null;
    }
}
