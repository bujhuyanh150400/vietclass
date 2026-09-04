<?php

namespace App\Modules\FileManagement\Services;

use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\FileManagement\Repositories\ManagedFileRepository;
use App\Modules\FileManagement\Support\FileTypeMap;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use App\Modules\System\Repositories\SystemSettingRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToWriteFile;
use LogicException;

final class FileUploader
{
    /** Create the upload service with its persistence and quota collaborators. */
    public function __construct(
        private readonly ManagedFileRepository $files,
        private readonly SystemSettingRepository $settings,
    ) {}

    /** Store a validated upload and its metadata inside the caller's active transaction. */
    public function store(User $owner, UploadedFile $upload, ?string $displayName): ManagedFile
    {
        $resolved = FileTypeMap::resolve(
            extension: $upload->getClientOriginalExtension(),
            mimeType: (string) $upload->getMimeType(),
        ) ?? throw new LogicException('A managed upload must be validated before storage.');
        $path = "users/{$owner->id}/".Str::uuid().".{$resolved['extension']}";
        $lock = Cache::lock("file-upload-owner:{$owner->id}", 300);

        if (! $lock->get()) {
            throw new ActionError(
                message: 'Không thể giữ khóa upload.',
                code: FileError::StorageUnavailable,
            );
        }

        DB::afterCommit(fn (): bool => $lock->release());
        DB::afterRollBack(fn (): bool => $lock->release());

        $this->assertQuota(owner: $owner, uploadBytes: (int) $upload->getSize());

        $disk = (string) config('file-management.disk');
        DB::afterRollBack(fn () => $this->deleteAfterRollback(disk: $disk, path: $path, ownerId: $owner->id));

        try {
            $written = Storage::disk($disk)->putFileAs(dirname($path), $upload, basename($path));
        } catch (UnableToWriteFile) {
            throw new ActionError(
                message: 'Không thể lưu tệp.',
                code: FileError::StorageUnavailable,
            );
        }

        if ($written === false) {
            throw new ActionError(
                message: 'Không thể lưu tệp.',
                code: FileError::StorageUnavailable,
            );
        }

        $originalName = $upload->getClientOriginalName();

        return $this->files->create([
            'owner_user_id' => $owner->id,
            'original_name' => $originalName,
            'display_name' => $displayName ?? $originalName,
            'disk' => $disk,
            'path' => $path,
            'extension' => $resolved['extension'],
            'mime_type' => $resolved['mime_type'],
            'size_bytes' => $upload->getSize(),
        ]);
    }

    /** Reject an upload whose bytes would exceed the owning role's configured limit. */
    private function assertQuota(User $owner, int $uploadBytes): void
    {
        $quota = $this->settings->fileQuotas()[$this->roleKey($owner->role)];

        if ($this->files->usageBytes($owner->id) + $uploadBytes > $quota) {
            throw new ActionError(
                message: 'Dung lượng lưu trữ không đủ.',
                code: FileError::QuotaExceeded,
            );
        }
    }

    /** Convert a persisted user role into its system quota key. */
    private function roleKey(UserRole $role): string
    {
        return strtolower($role->name);
    }

    /** Remove an object made by a transaction that subsequently rolls back. */
    private function deleteAfterRollback(string $disk, string $path, int $ownerId): void
    {
        try {
            if (! Storage::disk($disk)->delete($path)) {
                Log::warning('Managed upload rollback cleanup failed.', [
                    'disk' => $disk,
                    'path' => $path,
                    'owner_id' => $ownerId,
                ]);
            }
        } catch (UnableToDeleteFile) {
            Log::warning('Managed upload rollback cleanup failed.', [
                'disk' => $disk,
                'path' => $path,
                'owner_id' => $ownerId,
            ]);
        }
    }
}
