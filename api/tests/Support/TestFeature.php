<?php

namespace Tests\Support;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Identity\Enums\UserRole;

/**
 * A disposable permission declaration used to exercise the Access module before any
 * real module declares one, mirroring how MakeModuleCommandTest uses a throwaway module.
 */
enum TestFeature: string implements FeatureEnum
{
    /** Held by administrators only. */
    case AdminOnly = 'testing.admin_only';

    /** Held by both administrators and teachers. */
    case Shared = 'testing.shared';

    /** Declared but granted to no role, so only an override can produce it. */
    case Unassigned = 'testing.unassigned';

    public function label(): string
    {
        return match ($this) {
            self::AdminOnly => 'Chỉ quản trị viên',
            self::Shared => 'Dùng chung',
            self::Unassigned => 'Chưa cấp cho vai trò nào',
        };
    }

    public function group(): string
    {
        return 'testing';
    }

    /**
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::AdminOnly => [UserRole::Admin],
            self::Shared => [UserRole::Admin, UserRole::Teacher],
            self::Unassigned => [],
        };
    }
}
