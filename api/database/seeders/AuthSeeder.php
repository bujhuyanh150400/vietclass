<?php

namespace Database\Seeders;

use App\Modules\Auth\Repositories\FeatureRepository;
use App\Modules\Auth\Support\FeatureRegistry;
use Illuminate\Database\Seeder;

final class AuthSeeder extends Seeder
{
    /**
     * Mirror every declared permission into the catalogue so a fresh database can
     * carry per-user overrides straight away. Running it again changes nothing.
     */
    public function run(FeatureRegistry $registry, FeatureRepository $features): void
    {
        $features->upsertMany($registry->all());
    }
}
