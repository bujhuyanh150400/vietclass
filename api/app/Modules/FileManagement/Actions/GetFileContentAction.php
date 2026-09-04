<?php

namespace App\Modules\FileManagement\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\FileManagement\Support\FileTypeMap;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class GetFileContentAction
{
    /** Create the content action with its visible-file query collaborator. */
    public function __construct(
        private readonly ManagedFileRepository $files,
    ) {}

    /** Authorize first, then return a five-minute signed URL for the stored object path. */
    public function handle(User $actor, int $fileId, bool $download): ActionResult
    {
        try {
            $file = $this->files->findVisible(actor: $actor, fileId: $fileId);

            if (! $file instanceof ManagedFile) {
                throw new ActionError(
                    message: 'Không tìm thấy tệp.',
                    code: FileError::NotFound,
                );
            }

            try {
                $url = Storage::disk($file->disk)->temporaryUrl(
                    $file->path,
                    now()->addMinutes(5),
                    ['ResponseContentDisposition' => $this->contentDisposition(file: $file, download: $download)],
                );
            } catch (InvalidArgumentException|RuntimeException) {
                Log::warning('Managed file temporary URL generation failed.', [
                    'file_id' => $file->id,
                    'owner_id' => $file->owner_user_id,
                    'disk' => $file->disk,
                ]);

                throw new ActionError(
                    message: 'Không thể mở nội dung tệp.',
                    code: FileError::StorageUnavailable,
                );
            }

            return ActionResult::success($url);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Build a safe inline or attachment header without changing the stored object key. */
    private function contentDisposition(ManagedFile $file, bool $download): string
    {
        $disposition = $download || ! in_array(FileTypeMap::category($file->extension), ['image', 'pdf'], true)
            ? HeaderUtils::DISPOSITION_ATTACHMENT
            : HeaderUtils::DISPOSITION_INLINE;
        $filename = (string) Str::of($file->display_name)
            ->replaceMatches('/[\\\\\/\x00-\x1F\x7F]+/u', '_')
            ->trim();
        $filename = $filename !== '' ? $filename : "file.{$file->extension}";
        $fallback = (string) Str::of(Str::ascii($filename))
            ->replace(['%', '/', '\\'], '_')
            ->replaceMatches('/[^\x20-\x7E]/', '_');

        return HeaderUtils::makeDisposition($disposition, $filename, $fallback);
    }
}
