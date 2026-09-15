<?php

namespace App\Modules\System\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\System\Enums\FileError;
use App\Modules\System\Models\ManagedFile;
use App\Modules\System\Repositories\FileLinkRepository;
use App\Modules\System\Repositories\ManagedFileRepository;
use App\Modules\System\Services\FileDeleter;
use App\Modules\Auth\Models\User;
use Illuminate\Support\Facades\DB;

final class PermanentlyDeleteFileAction
{
    /** Create the permanent-delete action with its locked metadata and object cleanup collaborators. */
    public function __construct(
        private readonly ManagedFileRepository $files,
        private readonly FileLinkRepository $links,
        private readonly FileDeleter $deleter,
    ) {}

    /** Delete a trashed, unlinked object's binary before force-deleting its metadata. */
    public function handle(User $actor, int $fileId): ActionResult
    {
        try {
            DB::transaction(function () use ($actor, $fileId): void {
                $file = $this->files->findVisibleForUpdate(actor: $actor, fileId: $fileId, withTrashed: true);

                if (! $file instanceof ManagedFile) {
                    throw new ActionError(message: 'Không tìm thấy tệp.', code: FileError::NotFound);
                }

                if (! $file->trashed()) {
                    throw new ActionError(message: 'Tệp không ở trạng thái phù hợp.', code: FileError::LifecycleConflict);
                }

                if ($this->links->existsForFile($file->id)) {
                    throw new ActionError(message: 'Tệp đang được sử dụng.', code: FileError::Linked);
                }

                if (! $this->deleter->delete($file)) {
                    throw new ActionError(message: 'Không thể xóa tệp.', code: FileError::StorageUnavailable);
                }

                $file->forceDelete();
            });

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(error: $error->code(), message: $error->getMessage());
        }
    }
}
