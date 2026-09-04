<?php

namespace App\Modules\FileManagement\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;

final class FileLinkRepository extends BaseRepository
{
    /** Return the Eloquent model behind file-link queries. */
    protected function modelClass(): ?string
    {
        return FileLink::class;
    }

    /** This repository does not use a raw database table. */
    protected function table(): ?string
    {
        return null;
    }

    /** Determine whether any domain record still uses the managed file. */
    public function existsForFile(int $fileId): bool
    {
        return $this->modelQuery()->where('file_id', $fileId)->exists();
    }

    /** Remove every link of one domain type from the target while its owning row is locked. */
    public function deleteForTarget(FileLinkType $type, int $foreignId): void
    {
        $this->modelQuery()
            ->where('type', $type)
            ->where('foreign_id', $foreignId)
            ->delete();
    }

    /** Create one domain-owned file usage link. */
    public function create(int $fileId, FileLinkType $type, int $foreignId): FileLink
    {
        return $this->modelQuery()->create([
            'file_id' => $fileId,
            'type' => $type,
            'foreign_id' => $foreignId,
        ]);
    }
}
