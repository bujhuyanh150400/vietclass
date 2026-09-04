<?php

namespace App\Modules\System\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\User;
use App\Modules\System\Models\SystemSetting;

final class SystemSettingRepository extends BaseRepository
{
    public const FILE_QUOTAS = [
        'admin' => 10_737_418_240,
        'teacher' => 2_147_483_648,
        'student' => 524_288_000,
        'guardian' => 524_288_000,
    ];

    /** This repository is backed by the SystemSetting model. */
    protected function modelClass(): ?string
    {
        return SystemSetting::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return the stored file quotas, falling back to the fixed role defaults before
     * an administrator has saved a setting.
     *
     * @return array{admin: int, teacher: int, student: int, guardian: int}
     */
    public function fileQuotas(): array
    {
        return $this->modelQuery()->where('key', 'file_storage.quotas')->value('value')
            ?? self::FILE_QUOTAS;
    }

    /**
     * Upsert the only setting this repository owns and attribute its latest change.
     *
     * @param  array{admin: int, teacher: int, student: int, guardian: int}  $quotas
     * @return array{admin: int, teacher: int, student: int, guardian: int}
     */
    public function updateFileQuotas(array $quotas, User $actor): array
    {
        $setting = $this->modelQuery()->updateOrCreate(
            ['key' => 'file_storage.quotas'],
            ['value' => $quotas, 'updated_by' => $actor->id],
        );

        return $setting->value;
    }
}
