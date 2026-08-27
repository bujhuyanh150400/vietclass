<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;

final class CreateSubjectAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Create a subject.
     *
     * Name uniqueness is rejected by the Form Request and by the database index, so
     * this operation has no business failure of its own.
     *
     * @param  array{name: string, description?: string|null, is_active?: bool}  $attributes
     * @return ActionResult<Subject, AcademicError>
     */
    public function handle(array $attributes): ActionResult
    {
        return ActionResult::success($this->subjects->create($attributes));
    }
}
