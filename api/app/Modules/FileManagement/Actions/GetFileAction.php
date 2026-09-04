<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\Identity\Models\User;

final class GetFileAction
{
    /** Create the metadata action with its visible-file query collaborator. */
    public function __construct(
        private readonly ManagedFileRepository $files,
    ) {}

    /** Return active file metadata only when the caller can see the owner library. */
    public function handle(User $actor, int $fileId): ActionResult
    {
        try {
            $file = $this->files->findVisible(actor: $actor, fileId: $fileId);

            if (! $file instanceof ManagedFile) {
                throw new ActionError(
                    message: 'Không tìm thấy tệp.',
                    code: FileError::NotFound,
                );
            }

            return ActionResult::success($file);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
