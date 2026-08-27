<?php

namespace App\Modules\Auth\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\User;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

final class PersonalAccessTokenRepository extends BaseRepository
{
    /**
     * This repository is conceptually backed by the PersonalAccessToken model, but every
     * method here works off an already-loaded User/token instance and never queries
     * through modelQuery() itself.
     */
    protected function modelClass(): ?string
    {
        return PersonalAccessToken::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Issue a bearer token with the configured normal or remembered lifetime.
     */
    public function issue(User $user, bool $remember): NewAccessToken
    {
        $expirationDays = $remember
            ? config('identity.remember_token_expiration_days')
            : config('identity.token_expiration_days');

        return $user->createToken(
            name: (string) config('identity.token_name'),
            abilities: ['*'],
            expiresAt: now()->addDays((int) $expirationDays),
        );
    }

    /**
     * Delete the one persistent token used by the current bearer request.
     */
    public function revokeCurrent(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }
}
