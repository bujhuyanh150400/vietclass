<?php

namespace App\Modules\Auth\Repositories;

use App\Core\Repositories\BaseRepository;

final class FeatureUserRepository extends BaseRepository
{
    /** This repository does not query through an Eloquent model. */
    protected function modelClass(): ?string
    {
        return null;
    }

    /** This repository is backed by the feature_user pivot table, which has no dedicated model. */
    protected function table(): ?string
    {
        return 'feature_user';
    }

    /**
     * Return one user's permission overrides keyed by feature code, where `true`
     * grants a permission the role does not carry and `false` withdraws one it does.
     *
     * @return array<string, bool>
     */
    public function overridesFor(int $userId): array
    {
        return $this->tableQuery()
            ->join('features', 'features.id', '=', 'feature_user.feature_id')
            ->where('feature_user.user_id', $userId)
            ->pluck('feature_user.granted', 'features.code')
            ->map(static fn (mixed $granted): bool => (bool) $granted)
            ->all();
    }
}
