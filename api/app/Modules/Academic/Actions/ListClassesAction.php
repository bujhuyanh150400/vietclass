<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListClassesAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Return one page of classes for the given search, filter, and sort request.
     *
     * @return ActionResult<LengthAwarePaginator<int, SchoolClass>, AcademicError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->classes->paginateList($query));
    }
}
