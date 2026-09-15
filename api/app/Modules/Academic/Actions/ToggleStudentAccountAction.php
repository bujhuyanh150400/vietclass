<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\StudentRepository;
use App\Modules\Auth\Repositories\UserRepository;

final class ToggleStudentAccountAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly UserRepository $users,
    ) {}

    /**
     * Lock or unlock a student's login account.
     *
     * The profile and every enrolment pointing at it are left untouched; only the
     * ability to sign in changes. Whether the student is still studying is a separate
     * field on the profile.
     *
     * @return ActionResult<StudentProfile, AcademicPersonError>
     */
    public function handle(int $studentId, bool $isActive): ActionResult
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

            $this->users->setActive($student->profile->user, $isActive);

            return ActionResult::success($this->students->findById($studentId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
