<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\StudentRepository;
use App\Modules\Auth\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

final class ChangeStudentPasswordAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly UserRepository $users,
    ) {}

    /**
     * Replace the password on a student's login account.
     *
     * Saving the hash and revoking this account's bearer tokens share one transaction,
     * so a token-store failure cannot leave a changed password with live old sessions.
     *
     * @return ActionResult<null, AcademicPersonError>
     */
    public function handle(int $studentId, string $password): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicPersonError::StudentNotFound,
                );
            }

            if (! $student->profile->user instanceof User) {
                throw new ActionError(
                    message: 'Học sinh này chưa có tài khoản đăng nhập.',
                    code: AcademicPersonError::AccountNotProvisioned,
                );
            }

            DB::transaction(function () use ($student, $password): void {
                $this->users->changePassword($student->profile->user, $password);
                $this->users->deleteTokens($student->profile->user);
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
