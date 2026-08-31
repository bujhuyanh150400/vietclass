<?php

namespace App\Modules\Academic\Http\Controllers;

use App\Core\Http\BaseController;
use App\Core\Http\Requests\OptionRequest;
use App\Modules\Academic\Actions\ChangeRoomStatusAction;
use App\Modules\Academic\Actions\CreateRoomAction;
use App\Modules\Academic\Actions\DeleteRoomAction;
use App\Modules\Academic\Actions\GetRoomAction;
use App\Modules\Academic\Actions\ListRoomOptionsAction;
use App\Modules\Academic\Actions\ListRoomsAction;
use App\Modules\Academic\Actions\UpdateRoomAction;
use App\Modules\Academic\Http\Requests\Rooms\ChangeRoomStatusRequest;
use App\Modules\Academic\Http\Requests\Rooms\IndexRoomRequest;
use App\Modules\Academic\Http\Requests\Rooms\StoreRoomRequest;
use App\Modules\Academic\Http\Requests\Rooms\UpdateRoomRequest;
use App\Modules\Academic\Http\Resources\RoomOptionResource;
use App\Modules\Academic\Http\Resources\RoomResource;
use App\Modules\Academic\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class RoomController extends BaseController
{
    /**
     * Return one page of rooms.
     */
    public function index(IndexRoomRequest $request, ListRoomsAction $rooms): JsonResponse
    {
        $result = $rooms->handle(query: $request->toListQuery());

        /** @var LengthAwarePaginator<int, Room> $page */
        $page = $result->getData();

        return $this->paginated($request, $page, RoomResource::class);
    }

    /**
     * Return the active rooms that may be selected for a schedule.
     */
    public function options(OptionRequest $request, ListRoomOptionsAction $options): JsonResponse
    {
        $result = $options->handle(query: $request->toListQuery());

        /** @var Collection<int, Room> $rooms */
        $rooms = $result->getData();

        return $this->success(
            data: RoomOptionResource::collection($rooms)->resolve($request),
        );
    }

    /**
     * Create a room.
     */
    public function store(StoreRoomRequest $request, CreateRoomAction $create): JsonResponse
    {
        $result = $create->handle(attributes: $request->validated());

        /** @var Room $room */
        $room = $result->getData();

        return $this->success(
            data: RoomResource::make($room)->resolve($request),
            status: 201,
        );
    }

    /**
     * Return one room.
     */
    public function show(Request $request, GetRoomAction $room, int $roomId): JsonResponse
    {
        $result = $room->handle(roomId: $roomId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Room $found */
        $found = $result->getData();

        return $this->success(data: RoomResource::make($found)->resolve($request));
    }

    /**
     * Change a room's editable details.
     */
    public function update(UpdateRoomRequest $request, UpdateRoomAction $update, int $roomId): JsonResponse
    {
        $result = $update->handle(roomId: $roomId, attributes: $request->validated());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Room $room */
        $room = $result->getData();

        return $this->success(data: RoomResource::make($room)->resolve($request));
    }

    /**
     * Change a room's availability status.
     */
    public function changeStatus(
        ChangeRoomStatusRequest $request,
        ChangeRoomStatusAction $change,
        int $roomId,
    ): JsonResponse {
        $result = $change->handle(roomId: $roomId, status: $request->status());

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        /** @var Room $room */
        $room = $result->getData();

        return $this->success(data: RoomResource::make($room)->resolve($request));
    }

    /**
     * Remove a room no schedule references.
     */
    public function destroy(DeleteRoomAction $delete, int $roomId): Response|JsonResponse
    {
        $result = $delete->handle(roomId: $roomId);

        if (! $result->isSuccess()) {
            return $this->actionFailure(result: $result);
        }

        return $this->noContent();
    }
}
