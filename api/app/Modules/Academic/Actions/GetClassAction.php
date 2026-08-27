<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassRepository;

final class GetClassAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Return one class, or report that no class carries the identifier.
     *
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(int $classId): ActionResult
    {
        try {
            $class = $this->classes->findById($classId);

            if (! $class instanceof SchoolClass) {
                throw new ActionError(
                    message: 'Không tìm thấy lớp học.',
                    code: AcademicError::ClassNotFound,
                );
            }

            return ActionResult::success($class);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
