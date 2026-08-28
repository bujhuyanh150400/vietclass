<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Repositories\StudentRepository;
use App\Modules\Identity\Repositories\UserRepository;

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
     * @return ActionResult<StudentProfile, IdentityError>
     */
    public function handle(int $studentId, bool $isActive): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: IdentityError::StudentNotFound,
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
