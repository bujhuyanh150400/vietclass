<?php

namespace App\Modules\Auth\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Auth\Models\Feature;
use Illuminate\Contracts\Database\Query\Builder;

final class FeatureRepository extends BaseRepository
{
    /** This repository is backed by the Feature model. */
    protected function modelClass(): ?string
    {
        return Feature::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Insert or refresh the catalogue row for every declared permission, so an admin
     * interface can list permissions and per-user overrides have a row to point at.
     *
     * @param  array<string, FeatureEnum>  $features
     * @return int the number of catalogue rows written
     */
    public function upsertMany(array $features): int
    {
        foreach ($features as $feature) {
            $this->modelQuery()->updateOrCreate(
                ['code' => $feature->value],
                [
                    'name' => $feature->label(),
                    'group_code' => $feature->group(),
                ],
            );
        }

        return count($features);
    }

    /**
     * Return catalogue codes no module declares any more so they can be reported.
     * They are never deleted here: removing one would cascade away the per-user
     * overrides attached to it.
     *
     * @param  list<string>  $declaredCodes
     * @return list<string>
     */
    public function orphanCodes(array $declaredCodes): array
    {
        return $this->modelQuery()
            ->when(
                $declaredCodes !== [],
                static fn (Builder $query): Builder => $query->whereNotIn('code', $declaredCodes),
            )
            ->orderBy('code')
            ->pluck('code')
            ->all();
    }
}
