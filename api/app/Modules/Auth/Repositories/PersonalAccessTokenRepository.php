<?php

namespace App\Modules\Auth\Repositories;

use App\Modules\Identity\Models\User;
use Laravel\Sanctum\NewAccessToken;
use Laravel\Sanctum\PersonalAccessToken;

final class PersonalAccessTokenRepository
{
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
