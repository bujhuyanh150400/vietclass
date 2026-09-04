<?php

namespace App\Modules\FileManagement\Repositories;

use App\Core\Repositories\BaseRepository;
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
}
