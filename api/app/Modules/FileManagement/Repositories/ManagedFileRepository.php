<?php

namespace App\Modules\FileManagement\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\FileManagement\Models\ManagedFile;

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
}
