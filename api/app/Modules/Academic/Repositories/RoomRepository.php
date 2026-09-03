<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

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
     * No schedule table exists yet, so this deliberately returns zero. The deletion
     * rule's caller stays unchanged once a real reference count replaces it.
     */
    public function countScheduleReferences(Room $room): int
    {
        return 0;
    }
}
