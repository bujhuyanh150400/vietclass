<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListRoomsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Return one page of rooms for the given search, filter, and sort request.
     *
     * @return ActionResult<LengthAwarePaginator<int, Room>, AcademicError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->rooms->paginateList($query));
    }
}
