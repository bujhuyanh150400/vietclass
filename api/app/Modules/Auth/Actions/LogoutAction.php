<?php

namespace App\Modules\Auth\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Auth\Repositories\PersonalAccessTokenRepository;
use App\Modules\Identity\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

final class LogoutAction
{
    /**
     * Create the action with its token persistence collaborator.
     */
    public function __construct(private readonly PersonalAccessTokenRepository $tokens) {}

    /**
     * Revoke only the bearer token attached to the authenticated request.
     *
     * @return ActionResult<null, AuthError>
     */
    public function handle(?Authenticatable $user): ActionResult
    {
        try {
            if (! $user instanceof User) {
                throw new ActionError(
                    message: 'Chưa xác thực.',
                    code: AuthError::Unauthenticated,
                );
            }

            $this->tokens->revokeCurrent($user);

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
