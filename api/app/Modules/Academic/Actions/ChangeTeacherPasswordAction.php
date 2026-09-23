<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\TeacherRepository;
use App\Modules\Auth\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

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
     * Saving the hash and revoking this account's bearer tokens share one transaction,
     * so a token-store failure cannot leave a changed password with live old sessions.
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

            DB::transaction(function () use ($teacher, $password): void {
                $this->users->changePassword($teacher->profile->user, $password);
                $this->users->deleteTokens($teacher->profile->user);
            });

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
