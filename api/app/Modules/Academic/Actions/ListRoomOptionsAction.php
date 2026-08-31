<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;
use Illuminate\Database\Eloquent\Collection;

final class ListRoomOptionsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Return only the active rooms that callers may choose from.
     *
     * @return ActionResult<Collection<int, Room>, AcademicError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->rooms->options($query));
    }
}
