<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;

final class UpdateRoomAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Change a room's name, capacity, or note without altering its availability state.
     *
     * Availability belongs to ChangeRoomStatusAction, which the list screen reaches
     * through its own confirmed operation. A `status` key is therefore dropped rather
     * than applied, so no caller can move a room out of circulation as a side effect
     * of renaming it.
     *
     * @param  array{name: string, capacity: int, note?: string|null, status?: mixed}  $attributes
     * @return ActionResult<Room, AcademicError>
     */
    public function handle(int $roomId, array $attributes): ActionResult
    {
        try {
            $room = $this->rooms->findById($roomId);

            if (! $room instanceof Room) {
                throw new ActionError(
                    message: 'Không tìm thấy phòng học.',
                    code: AcademicError::RoomNotFound,
                );
            }

            // Ignored on purpose; see the note above this method.
            unset($attributes['status']);

            return ActionResult::success($this->rooms->update($room, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
