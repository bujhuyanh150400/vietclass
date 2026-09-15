<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\StudentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListStudentsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly StudentRepository $students,
    ) {}

    /**
     * Return one page of student profiles for the given search, filter, and sort request.
     *
     * @return ActionResult<LengthAwarePaginator<int, StudentProfile>, AcademicPersonError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->students->paginateList($query));
    }
}
