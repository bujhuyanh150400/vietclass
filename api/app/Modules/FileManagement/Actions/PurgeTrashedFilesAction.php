<?php

namespace App\Modules\FileManagement\Actions;

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\FileLinkRepository;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\FileManagement\Services\FileDeleter;
use Illuminate\Support\Facades\DB;

final class PurgeTrashedFilesAction
{
    /** Create the scheduled purge action with its metadata, link, and object cleanup collaborators. */
    public function __construct(
        private readonly ManagedFileRepository $files,
        private readonly FileLinkRepository $links,
        private readonly FileDeleter $deleter,
    ) {}

    /**
     * Purge expired trashed files in one-hundred-row batches, retaining linked or failed records.
     *
     * @return array{purged: int, failed: int, linked: int}
     */
    public function handle(): array
    {
        $cutoff = now()->subDays(30);
        $result = ['purged' => 0, 'failed' => 0, 'linked' => 0];

        $this->files->eachExpiredTrashed($cutoff, function (ManagedFile $candidate) use (&$result, $cutoff): void {
            DB::transaction(function () use ($candidate, &$result, $cutoff): void {
                $file = $this->files->findTrashedForUpdate($candidate->id);

                if (! $file instanceof ManagedFile || $file->deleted_at?->gt($cutoff)) {
                    return;
                }

                if ($this->links->existsForFile($file->id)) {
                    $result['linked']++;

                    return;
                }

                if (! $this->deleter->delete($file)) {
                    $result['failed']++;

                    return;
                }

                $file->forceDelete();
                $result['purged']++;
            });
        });

        return $result;
    }
}
