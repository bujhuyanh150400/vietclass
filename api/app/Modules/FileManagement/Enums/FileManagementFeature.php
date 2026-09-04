<?php

namespace App\Modules\FileManagement\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Support\Str;

/** Every permission the File Management module owns. */
enum FileManagementFeature: string implements FeatureEnum
{
    /** See the caller's file library. */
    case List = 'file.list';

    /** Upload a file to the caller's library. */
    case Upload = 'file.upload';

    /** Change metadata for a file the caller can manage. */
    case Update = 'file.update';

    /** Change the lifecycle of a file the caller can manage. */
    case Delete = 'file.delete';

    /** Return the caller-facing name shown for this permission in the catalogue. */
    public function label(): string
    {
        return match ($this) {
            self::List => 'Xem danh sách tệp',
            self::Upload => 'Tải tệp lên',
            self::Update => 'Sửa thông tin tệp',
            self::Delete => 'Xóa tệp',
        };
    }

    /** Return the catalogue grouping key for this permission. */
    public function group(): string
    {
        return Str::before($this->value, '.');
    }

    /** Return the roles that hold this permission before per-user overrides apply.
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return UserRole::cases();
    }
}
