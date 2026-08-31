<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Repositories\RoomRepository;

final class DeleteRoomAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Remove a room only when no schedule record still references it.
     *
     * @return ActionResult<null, AcademicError>
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

            $scheduleReferences = $this->rooms->countScheduleReferences($room);

            if ($scheduleReferences > 0) {
                throw new ActionError(
                    message: "Phòng học đang được dùng bởi {$scheduleReferences} lịch, không thể xóa.",
                    code: AcademicError::RoomInUse,
                );
            }

            $this->rooms->delete($room);

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
