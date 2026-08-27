<?php

namespace App\Modules\Auth\Repositories;

use Illuminate\Support\Facades\DB;

final class FeatureUserRepository
{
    /**
     * Return one user's permission overrides keyed by feature code, where `true`
     * grants a permission the role does not carry and `false` withdraws one it does.
     *
     * @return array<string, bool>
     */
    public function overridesFor(int $userId): array
    {
        return DB::table('feature_user')
            ->join('features', 'features.id', '=', 'feature_user.feature_id')
            ->where('feature_user.user_id', $userId)
            ->pluck('feature_user.granted', 'features.code')
            ->map(static fn (mixed $granted): bool => (bool) $granted)
            ->all();
    }
}
