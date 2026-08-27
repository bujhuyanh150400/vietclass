<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Repositories\TeacherRepository;

final class UpdateTeacherAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Change a teacher profile.
     *
     * The login name is not part of this operation: it identifies the account across
     * tokens and logs, and the fork treated it as fixed after creation too. Password
     * and account locking each have their own endpoint.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<Teacher, IdentityError>
     */
    public function handle(int $teacherId, array $attributes): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof Teacher) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: IdentityError::TeacherNotFound,
                );
            }

            return ActionResult::success($this->teachers->update($teacher, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
