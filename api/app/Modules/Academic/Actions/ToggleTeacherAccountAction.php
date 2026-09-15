<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\TeacherRepository;
use App\Modules\Auth\Repositories\UserRepository;

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
     * @return ActionResult<TeacherProfile, AcademicPersonError>
     */
    public function handle(int $teacherId, bool $isActive): ActionResult
    {
        try {
            $teacher = $this->teachers->findById($teacherId);

            if (! $teacher instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: AcademicPersonError::TeacherNotFound,
                );
            }

            if (! $teacher->profile->user instanceof User) {
                throw new ActionError(
                    message: 'Giáo viên này chưa có tài khoản đăng nhập.',
                    code: AcademicPersonError::AccountNotProvisioned,
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
