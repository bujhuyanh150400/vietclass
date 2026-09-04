<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\DB;

final class RestoreFileAction
{
    /** Create the restore action with its locked visible-file repository. */
    public function __construct(
        private readonly ManagedFileRepository $files,
    ) {}

    /** Restore one trashed visible file while preserving every persisted storage coordinate. */
    public function handle(User $actor, int $fileId): ActionResult
    {
        try {
            $file = DB::transaction(function () use ($actor, $fileId): ManagedFile {
                $file = $this->files->findVisibleForUpdate(actor: $actor, fileId: $fileId, withTrashed: true);

                if (! $file instanceof ManagedFile) {
                    throw new ActionError(message: 'Không tìm thấy tệp.', code: FileError::NotFound);
                }

                if (! $file->trashed()) {
                    throw new ActionError(message: 'Tệp không ở trạng thái phù hợp.', code: FileError::LifecycleConflict);
                }

                $file->restore();

                return $file;
            });

            return ActionResult::success($file);
        } catch (ActionError $error) {
            return ActionResult::error(error: $error->code(), message: $error->getMessage());
        }
    }
}
