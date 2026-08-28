<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\TeacherRepository;
use App\Modules\Identity\Repositories\UserRepository;

final class ToggleTeacherAccountAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly UserRepository $users,
    ) {}

    /**
     * Lock or unlock a teacher's login account.
     *
     * The profile row is left untouched, because the classes and history pointing at it
     * must survive; only the ability to sign in changes.
     *
     * @return ActionResult<TeacherProfile, IdentityError>
     */
    public function handle(int $teacherId, bool $isActive): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: IdentityError::TeacherNotFound,
                );
            }

            if (! $teacher->profile->user instanceof User) {
                throw new ActionError(
                    message: 'Giáo viên này chưa có tài khoản đăng nhập.',
                    code: IdentityError::AccountNotProvisioned,
                );
            }

            $this->users->setActive($teacher->profile->user, $isActive);

            return ActionResult::success($this->teachers->findById($teacherId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
