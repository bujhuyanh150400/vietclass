<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\FileLinkRepository;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\DB;

final class TrashFileAction
{
    /** Create the trash action with the locked file and usage-link repositories. */
    public function __construct(
        private readonly ManagedFileRepository $files,
        private readonly FileLinkRepository $links,
    ) {}

    /** Move one active, unlinked visible file into trash without removing its private object. */
    public function handle(User $actor, int $fileId): ActionResult
    {
        try {
            $file = DB::transaction(function () use ($actor, $fileId): ManagedFile {
                $file = $this->files->findVisibleForUpdate(actor: $actor, fileId: $fileId, withTrashed: true);

                if (! $file instanceof ManagedFile) {
                    throw new ActionError(message: 'Không tìm thấy tệp.', code: FileError::NotFound);
                }

                if ($file->trashed()) {
                    throw new ActionError(message: 'Tệp không ở trạng thái phù hợp.', code: FileError::LifecycleConflict);
                }

                if ($this->links->existsForFile($file->id)) {
                    throw new ActionError(message: 'Tệp đang được sử dụng.', code: FileError::Linked);
                }

                $file->delete();

                return $file;
            });

            return ActionResult::success($file);
        } catch (ActionError $error) {
            return ActionResult::error(error: $error->code(), message: $error->getMessage());
        }
    }
}
