<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\TeacherRepository;
use App\Modules\Auth\Repositories\UserRepository;

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
     * @return ActionResult<null, AcademicPersonError>
     */
    public function handle(int $teacherId, string $password): ActionResult
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
