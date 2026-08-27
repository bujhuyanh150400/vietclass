<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListEnrollmentsAction
{
    /**
     * Create the action with its query collaborators.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * Return one page of a class roster.
     *
     * @return ActionResult<LengthAwarePaginator<int, ClassEnrollment>, AcademicError>
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

            return ActionResult::success($this->enrollments->paginateForClass($classId, $query));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
