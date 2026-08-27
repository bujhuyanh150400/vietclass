<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Repositories\TeacherRepository;

final class GetTeacherAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Return one teacher profile, or report that no profile carries the identifier.
     *
     * @return ActionResult<Teacher, IdentityError>
     */
    public function handle(int $teacherId): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof Teacher) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: IdentityError::TeacherNotFound,
                );
            }

            return ActionResult::success($teacher);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
