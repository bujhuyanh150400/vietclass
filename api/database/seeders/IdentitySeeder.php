<?php

namespace Database\Seeders;

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Seeder;

final class IdentitySeeder extends Seeder
{
    /**
     * Seed the local development administrator without creating duplicates.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['username' => 'admin@admin.com'],
            [
                'password' => 'password',
                'role' => UserRole::Admin,
                'is_active' => true,
            ],
        );
    }
}
