<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RoomRepository extends BaseRepository
{
    /** This repository is backed by the Room model. */
    protected function modelClass(): ?string
    {
        return Room::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of rooms filtered by their availability status and name.
     *
     * @return LengthAwarePaginator<int, Room>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return $this->modelQuery()
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where('name', 'ilike', $query->searchLike()),
            )
            ->when(
                $query->hasFilter('status'),
                fn (Builder $builder): Builder => $builder->where('status', $query->filter('status')),
            )
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the active rooms that can be selected for a schedule.
     *
     * @return Collection<int, Room>
     */
    public function options(ListQuery $query): Collection
    {
        return $this->modelQuery()
            ->where('status', RoomStatus::Active)
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where('name', 'ilike', $query->searchLike()),
            )
            ->orderBy('name')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one room by identifier.
     */
    public function findById(int $roomId): ?Room
    {
        return $this->modelQuery()->find($roomId);
    }

    /**
     * Persist a new room.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Room
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply editable details to an existing room and return it.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Room $room, array $attributes): Room
    {
        $room->fill($attributes)->save();

        return $room;
    }

    /**
     * Remove a room that no schedule references.
     */
    public function delete(Room $room): void
    {
        $room->delete();
    }

    /**
     * Count schedule records that reference a room before it can be removed.
     *
     * The table is named as a string rather than reached through the Schedule module's
     * model on purpose: Schedule depends on Academic for rooms and classes, so an
     * import in this direction would close the cycle and make neither module loadable
     * without the other. A room deletion is refused by counting rows, and a row count
     * needs no model.
     *
     * Both kinds of schedule record count: a weekly slot booked into the room, and a
     * written session held in it. A room still holding one session is as much in use as
     * one holding a weekly slot, and a projected session needs no counting of its own
     * because the fixed schedule it comes from is already counted.
     */
    public function countScheduleReferences(Room $room): int
    {
        return DB::table('schedule_templates')
            ->where('room_id', $room->id)
            ->count()
            + DB::table('schedule_instances')
                ->where('room_id', $room->id)
                ->count();
    }
}
