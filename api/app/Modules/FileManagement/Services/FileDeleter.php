<?php

namespace App\Modules\FileManagement\Services;

use App\Modules\FileManagement\Models\ManagedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use League\Flysystem\FilesystemException;
use RuntimeException;

final class FileDeleter
{
    /** Delete a private object, accepting an already-missing object as a successful cleanup. */
    public function delete(ManagedFile $file): bool
    {
        try {
            $disk = Storage::disk($file->disk);

            if (! $disk->exists($file->path)) {
                return true;
            }

            if ($disk->delete($file->path)) {
                return true;
            }
        } catch (FilesystemException|InvalidArgumentException|RuntimeException) {
            // The log remains internal and records only the identifiers needed to retry cleanup.
        }

        Log::warning('Managed file deletion failed.', [
            'file_id' => $file->id,
            'owner_id' => $file->owner_user_id,
            'disk' => $file->disk,
            'path' => $file->path,
        ]);

        return false;
    }
}
