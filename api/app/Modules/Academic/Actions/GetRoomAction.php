<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;

final class GetRoomAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Return one room, or report that no room carries the requested identifier.
     *
     * @return ActionResult<Room, AcademicError>
     */
    public function handle(int $roomId): ActionResult
    {
        try {
            $room = $this->rooms->findById($roomId);

            if (! $room instanceof Room) {
                throw new ActionError(
                    message: 'Không tìm thấy phòng học.',
                    code: AcademicError::RoomNotFound,
                );
            }

            return ActionResult::success($room);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
