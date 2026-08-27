<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;

final class UserRepository extends BaseRepository
{
    /** This repository is backed by the User model. */
    protected function modelClass(): ?string
    {
        return User::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Find an active user by its unique login name.
     */
    public function findActiveByUsername(string $username): ?User
    {
        return $this->modelQuery()
            ->where('username', $username)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Create the login account that backs a profile owned by another module, so those
     * modules never write to the identity table themselves. The model's `hashed` cast
     * stores the password; the plain value is never persisted.
     */
    public function createAccount(string $username, string $password, UserRole $role): User
    {
        return $this->modelQuery()->create([
            'username' => $username,
            'password' => $password,
            'role' => $role,
            'is_active' => true,
        ]);
    }

    /**
     * Replace an account's password.
     */
    public function changePassword(User $user, string $password): void
    {
        $user->forceFill(['password' => $password])->save();
    }

    /**
     * Lock or unlock an account. A locked account keeps any bearer token it was already
     * issued, so every permission check refuses it separately.
     */
    public function setActive(User $user, bool $isActive): void
    {
        $user->forceFill(['is_active' => $isActive])->save();
    }
}
