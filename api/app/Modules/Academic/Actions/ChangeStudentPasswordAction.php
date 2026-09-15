<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\StudentRepository;
use App\Modules\Auth\Repositories\UserRepository;

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
     * Existing bearer tokens are left alone, matching how a teacher password change
     * behaves; revoking them is a separate decision this release does not make.
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

            $this->users->changePassword($student->profile->user, $password);

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
