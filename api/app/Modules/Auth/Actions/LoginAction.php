<?php

namespace App\Modules\Auth\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Auth\Repositories\PersonalAccessTokenRepository;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\NewAccessToken;

final class LoginAction
{
    /**
     * Create the action with explicit query and token persistence collaborators.
     */
    public function __construct(
        private readonly UserRepository $users,
        private readonly PersonalAccessTokenRepository $tokens,
    ) {}

    /**
     * Verify credentials and issue a bearer token for an active user.
     *
     * @param  array{username: string, password: string, remember?: bool}  $credentials
     * @return ActionResult<array{user: User, token: NewAccessToken}, AuthError>
     */
    public function handle(array $credentials): ActionResult
    {
        try {
            $user = $this->users->findActiveByUsername($credentials['username']);

            if (! $user instanceof User || ! Hash::check($credentials['password'], $user->password)) {
                throw new ActionError(
                    message: 'Thông tin đăng nhập không chính xác.',
                    code: AuthError::InvalidCredentials,
                );
            }

            return ActionResult::success([
                'user' => $user,
                'token' => $this->tokens->issue($user, $credentials['remember'] ?? false),
            ]);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
