<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;

final class ChangeRoomStatusAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Change the availability state of an existing room.
     *
     * @return ActionResult<Room, AcademicError>
     */
    public function handle(int $roomId, RoomStatus $status): ActionResult
    {
        try {
            $room = $this->rooms->findById($roomId);

            if (! $room instanceof Room) {
                throw new ActionError(
                    message: 'Không tìm thấy phòng học.',
                    code: AcademicError::RoomNotFound,
                );
            }

            return ActionResult::success($this->rooms->update($room, ['status' => $status]));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
