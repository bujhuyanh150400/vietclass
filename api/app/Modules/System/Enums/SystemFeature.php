<?php

namespace App\Modules\System\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Auth\Enums\UserRole;
use Illuminate\Support\Str;

/** Every permission the System module owns. */
enum SystemFeature: string implements FeatureEnum
{
    /** See the caller's file library. */
    case FileList = 'file.list';

    /** Upload a file to the caller's library. */
    case FileUpload = 'file.upload';

    /** Change metadata for a file the caller can manage. */
    case FileUpdate = 'file.update';

    /** Change the lifecycle of a file the caller can manage. */
    case FileDelete = 'file.delete';

    /** View and change file-storage limits by account role. */
    case FileQuotaManage = 'file_quota.manage';

    /** Return the caller-facing name shown for this permission in the catalogue. */
    public function label(): string
    {
        return match ($this) {
            self::FileList => 'Xem danh sách tệp',
            self::FileUpload => 'Tải tệp lên',
            self::FileUpdate => 'Sửa thông tin tệp',
            self::FileDelete => 'Xóa tệp',
            self::FileQuotaManage => 'Quản lý hạn mức lưu trữ tệp',
        };
    }

    /** Return the catalogue grouping key for this permission. */
    public function group(): string
    {
        return Str::before($this->value, '.');
    }

    /**
     * Return the roles that hold this permission before per-user overrides apply.
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::FileQuotaManage => [UserRole::Admin],
            default => UserRole::cases(),
        };
    }
}
