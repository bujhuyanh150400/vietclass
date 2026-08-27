<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;
use Illuminate\Database\Eloquent\Collection;

final class ListSubjectOptionsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Return the subjects a class may be assigned to.
     *
     * Locked subjects are excluded here rather than only rejected on submit, which is
     * how the fork let a locked subject reach the class form and fail late.
     *
     * @return ActionResult<Collection<int, Subject>, AcademicError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->subjects->options($query));
    }
}
