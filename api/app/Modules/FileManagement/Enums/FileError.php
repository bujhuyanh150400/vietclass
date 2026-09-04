<?php

namespace App\Modules\FileManagement\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

/** Every expected business failure the File Management module reports. */
enum FileError: string implements ErrorDeclarationEnum
{
    /** The file does not exist or is not visible to the caller. */
    case NotFound = 'FILE-001';

    /** The owner's remaining storage quota cannot accommodate the upload. */
    case QuotaExceeded = 'FILE-002';

    /** The configured storage backend cannot complete the requested operation. */
    case StorageUnavailable = 'FILE-003';

    /** The file is linked to a domain record and cannot be changed as requested. */
    case Linked = 'FILE-004';

    /** The file is not in the lifecycle state required for the operation. */
    case LifecycleConflict = 'FILE-005';

    /** Return the HTTP status this business failure reaches the API boundary with. */
    public function httpStatus(): int
    {
        return match ($this) {
            self::NotFound => 404,
            self::QuotaExceeded, self::Linked, self::LifecycleConflict => 409,
            self::StorageUnavailable => 503,
        };
    }
}
