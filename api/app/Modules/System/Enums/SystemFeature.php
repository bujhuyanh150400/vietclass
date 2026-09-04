<?php

namespace App\Modules\System\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Support\Str;

/** Every permission the System module owns. */
enum SystemFeature: string implements FeatureEnum
{
    /** View and change file-storage limits by account role. */
    case FileQuotaManage = 'file_quota.manage';

    /** Return the caller-facing name shown for this permission in the catalogue. */
    public function label(): string
    {
        return 'Quản lý hạn mức lưu trữ tệp';
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
        return [UserRole::Admin];
    }
}
