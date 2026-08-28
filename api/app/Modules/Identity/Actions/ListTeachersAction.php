<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Repositories\TeacherRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListTeachersAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Return one page of teacher profiles for the given search, filter, and sort request.
     *
     * @return ActionResult<LengthAwarePaginator<int, TeacherProfile>, IdentityError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->teachers->paginateList($query));
    }
}
