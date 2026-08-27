<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListSubjectsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Return one page of subjects for the given search, filter, and sort request.
     *
     * @return ActionResult<LengthAwarePaginator<int, Subject>, AcademicError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->subjects->paginateList($query));
    }
}
