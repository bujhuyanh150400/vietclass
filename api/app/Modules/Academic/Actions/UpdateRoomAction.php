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
     * Apply a room's editable details, including its availability status.
     *
     * The edit form owns every field a room has, status among them. The separate
     * ChangeRoomStatusAction remains for the list screen's confirmed one-step
     * transition, which changes availability without opening the form.
     *
     * @param  array{name: string, capacity: int, location?: string|null, note?: string|null, facilities?: list<int>, status?: int}  $attributes
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

            return ActionResult::success($this->rooms->update($room, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
