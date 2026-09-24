<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\TeacherRepository;

final class GetTeacherAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Return one teacher profile, or report that no profile carries the identifier.
     *
     * @return ActionResult<TeacherProfile, AcademicPersonError>
     */
    public function handle(int $teacherId): ActionResult
    {
        try {
            $teacher = $this->teachers->findByIdWithEndedAssignments($teacherId);

            if (! $teacher instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: AcademicPersonError::TeacherNotFound,
                );
            }

            return ActionResult::success($teacher);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
