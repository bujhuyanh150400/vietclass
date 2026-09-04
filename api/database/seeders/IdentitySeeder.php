<?php

namespace Database\Seeders;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Seeder;

final class IdentitySeeder extends Seeder
{
    /**
     * Seed the local development administrator without creating duplicates.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['username' => 'admin@admin.com'],
            [
                'password' => 'password',
                'role' => UserRole::Admin,
                'is_active' => true,
            ],
        );

        Profile::query()->firstOrCreate(
            ['user_id' => $admin->id],
            [
                'full_name' => $admin->username,
                'gender' => Gender::Other,
            ],
        );
    }
}
