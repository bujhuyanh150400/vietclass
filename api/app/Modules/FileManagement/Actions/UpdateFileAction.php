<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Models\User;

final class UpdateFileAction
{
    /** Create the rename action with its visible-file persistence collaborator. */
    public function __construct(
        private readonly ManagedFileRepository $files,
    ) {}

    /** Rename an active file only when it is visible to the caller. */
    public function handle(User $actor, int $fileId, string $displayName): ActionResult
    {
        try {
            $file = $this->files->findVisible(actor: $actor, fileId: $fileId);

            if (! $file instanceof ManagedFile) {
                throw new ActionError(
                    message: 'Không tìm thấy tệp.',
                    code: FileError::NotFound,
                );
            }

            return ActionResult::success($this->files->updateDisplayName($file, $displayName));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
