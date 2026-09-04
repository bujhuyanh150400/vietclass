<?php

namespace App\Modules\FileManagement\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Support\FileTypeMap;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ManagedFileRepository extends BaseRepository
{
    /** Return the Eloquent model behind managed-file queries. */
    protected function modelClass(): ?string
    {
        return ManagedFile::class;
    }

    /** This repository does not use a raw database table. */
    protected function table(): ?string
    {
        return null;
    }

    /** Sum every byte owned by a user, including soft-deleted files that still retain quota. */
    public function usageBytes(int $ownerUserId): int
    {
        return (int) $this->modelQuery()
            ->withTrashed()
            ->where('owner_user_id', $ownerUserId)
            ->sum('size_bytes');
    }

    /** Persist one managed file after its private object has been written.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): ManagedFile
    {
        return $this->modelQuery()->forceCreate($attributes);
    }

    /** Return one page of active or trashed files within the caller's owner visibility. */
    public function paginateVisible(User $actor, ListQuery $query): LengthAwarePaginator
    {
        return $this->visibleQuery(actor: $actor, trashed: $query->filter('trash') === 'trashed')
            ->with(['owner.profile', 'links'])
            ->when(
                $query->hasSearch(),
                fn (Builder $files): Builder => $files->where(
                    fn (Builder $names): Builder => $names
                        ->where('display_name', 'ilike', $query->searchLike())
                        ->orWhere('original_name', 'ilike', $query->searchLike()),
                ),
            )
            ->when(
                $query->hasFilter('category'),
                fn (Builder $files): Builder => $files->whereIn(
                    'extension',
                    FileTypeMap::extensionsForCategory((string) $query->filter('category')),
                ),
            )
            ->when(
                $query->hasFilter('owner_user_id'),
                fn (Builder $files): Builder => $files->where('owner_user_id', $query->filter('owner_user_id')),
            )
            ->when(
                $query->hasFilter('uploaded_from'),
                fn (Builder $files): Builder => $files->whereDate('created_at', '>=', $query->filter('uploaded_from')),
            )
            ->when(
                $query->hasFilter('uploaded_to'),
                fn (Builder $files): Builder => $files->whereDate('created_at', '<=', $query->filter('uploaded_to')),
            )
            ->when(
                $query->hasFilter('link_type'),
                fn (Builder $files): Builder => $files->whereHas(
                    'links',
                    fn (Builder $links): Builder => $links->where('type', $query->filter('link_type')),
                ),
            )
            ->orderBy($query->sort, $query->direction)
            ->orderByDesc('id')
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /** Find one active or trashed file without revealing a different owner's record. */
    public function findVisible(User $actor, int $fileId, bool $trashed = false): ?ManagedFile
    {
        return $this->visibleQuery(actor: $actor, trashed: $trashed)
            ->with(['owner.profile', 'links'])
            ->find($fileId);
    }

    /** Lock one visible file so a lifecycle transition can re-check its current state. */
    public function findVisibleForUpdate(User $actor, int $fileId, bool $withTrashed = false): ?ManagedFile
    {
        return $this->modelQuery()
            ->when($withTrashed, fn (Builder $files): Builder => $files->withTrashed())
            ->when(
                $actor->role !== UserRole::Admin,
                fn (Builder $files): Builder => $files->where('owner_user_id', $actor->id),
            )
            ->with(['owner.profile', 'links'])
            ->lockForUpdate()
            ->find($fileId);
    }

    /** Lock one trashed file for a scheduled lifecycle transition. */
    public function findTrashedForUpdate(int $fileId): ?ManagedFile
    {
        return $this->modelQuery()
            ->onlyTrashed()
            ->with(['owner.profile', 'links'])
            ->lockForUpdate()
            ->find($fileId);
    }

    /** Visit expired trashed files in bounded batches without exposing storage coordinates. */
    public function eachExpiredTrashed(CarbonInterface $cutoff, callable $callback): void
    {
        $this->modelQuery()
            ->onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->orderBy('id')
            ->chunkById(100, function (Collection $files) use ($callback): void {
                $files->each($callback);
            });
    }

    /** Persist a user-facing rename while leaving immutable storage metadata untouched. */
    public function updateDisplayName(ManagedFile $file, string $displayName): ManagedFile
    {
        $file->display_name = $displayName;
        $file->save();

        return $file;
    }

    /** Start a query constrained to the actor's permitted owners and requested lifecycle state. */
    private function visibleQuery(User $actor, bool $trashed): Builder
    {
        return $this->modelQuery()
            ->when($trashed, fn (Builder $files): Builder => $files->onlyTrashed())
            ->when(
                $actor->role !== UserRole::Admin,
                fn (Builder $files): Builder => $files->where('owner_user_id', $actor->id),
            );
    }
}
