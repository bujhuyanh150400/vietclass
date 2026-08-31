<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;

final class CreateRoomAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Create a room with the fields validated at the HTTP boundary.
     *
     * @param  array{name: string, capacity?: int, note?: string|null, status?: RoomStatus}  $attributes
     * @return ActionResult<Room, AcademicError>
     */
    public function handle(array $attributes): ActionResult
    {
        return ActionResult::success($this->rooms->create($attributes));
    }
}
