<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListAvailableStudentsAction
{
    /**
     * Create the action with its query collaborators.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * Return one page of students who may still be added to a class, so the picker
     * never offers someone the enrolment rules would reject.
     *
     * @return ActionResult<LengthAwarePaginator<int, StudentProfile>, AcademicError>
     */
    public function handle(int $classId, ListQuery $query): ActionResult
    {
        try {
            if (! $this->classes->findById($classId) instanceof SchoolClass) {
                throw new ActionError(
                    message: 'Không tìm thấy lớp học.',
                    code: AcademicError::ClassNotFound,
                );
            }

            return ActionResult::success($this->enrollments->paginateAvailableForClass($classId, $query));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
