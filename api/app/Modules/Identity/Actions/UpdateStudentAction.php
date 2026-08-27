<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Repositories\StudentRepository;

final class UpdateStudentAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly StudentRepository $students,
    ) {}

    /**
     * Change a student profile.
     *
     * The login name is not part of this operation, matching how a teacher profile
     * behaves. Password and account locking each have their own endpoint.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<Student, IdentityError>
     */
    public function handle(int $studentId, array $attributes): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof Student) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: IdentityError::StudentNotFound,
                );
            }

            return ActionResult::success($this->students->update($student, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
