<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Repositories\StudentRepository;
use App\Modules\Identity\Repositories\UserRepository;

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
     * @return ActionResult<null, IdentityError>
     */
    public function handle(int $studentId, string $password): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: IdentityError::StudentNotFound,
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
