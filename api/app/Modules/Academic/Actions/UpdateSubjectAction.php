<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;

final class UpdateSubjectAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Change a subject's name or description.
     *
     * Locking and unlocking is deliberately not part of this operation: it carries a
     * rule about the classes using the subject, and that rule lives in exactly one
     * place, ToggleSubjectActiveAction.
     *
     * @param  array{name: string, description?: string|null}  $attributes
     * @return ActionResult<Subject, AcademicError>
     */
    public function handle(int $subjectId, array $attributes): ActionResult
    {
        try {
            $subject = $this->subjects->findById($subjectId);

            if (! $subject instanceof Subject) {
                throw new ActionError(
                    message: 'Không tìm thấy môn học.',
                    code: AcademicError::SubjectNotFound,
                );
            }

            return ActionResult::success($this->subjects->update($subject, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
