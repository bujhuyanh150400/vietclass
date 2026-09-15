<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\StudentRepository;

final class GetStudentAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly StudentRepository $students,
    ) {}

    /**
     * Return one student profile, or report that no profile carries the identifier.
     *
     * @return ActionResult<StudentProfile, AcademicPersonError>
     */
    public function handle(int $studentId): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicPersonError::StudentNotFound,
                );
            }

            return ActionResult::success($student);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
