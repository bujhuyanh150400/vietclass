<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Repositories\TeacherRepository;
use App\Modules\Identity\Repositories\UserRepository;

final class ChangeTeacherPasswordAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly UserRepository $users,
    ) {}

    /**
     * Replace the password on a teacher's login account.
     *
     * Existing bearer tokens are deliberately left alone: revoking them is a separate
     * decision this release does not make, and doing it silently here would sign the
     * teacher out of every device without anyone asking for that.
     *
     * @return ActionResult<null, IdentityError>
     */
    public function handle(int $teacherId, string $password): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: IdentityError::TeacherNotFound,
                );
            }

            $this->users->changePassword($teacher->profile->user, $password);

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
