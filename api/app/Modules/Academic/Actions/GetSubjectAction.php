<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;

final class GetSubjectAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Return one subject, or report that no subject carries the identifier.
     *
     * @return ActionResult<Subject, AcademicError>
     */
    public function handle(int $subjectId): ActionResult
    {
        try {
            $subject = $this->subjects->findById($subjectId);

            if (! $subject instanceof Subject) {
                throw new ActionError(
                    message: 'Không tìm thấy môn học.',
                    code: AcademicError::SubjectNotFound,
                );
            }

            return ActionResult::success($subject);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
