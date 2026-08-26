<?php

namespace App\Modules\Identity\Repositories;

use App\Modules\Identity\Models\User;

final class UserRepository
{
    /**
     * Find an active user by its unique login name.
     */
    public function findActiveByUsername(string $username): ?User
    {
        return User::query()
            ->where('username', $username)
            ->where('is_active', true)
            ->first();
    }
}
