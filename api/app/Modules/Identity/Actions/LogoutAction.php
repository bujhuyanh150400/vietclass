<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\PersonalAccessTokenRepository;
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
     * @return ActionResult<null, IdentityError>
     */
    public function handle(?Authenticatable $user): ActionResult
    {
        try {
            if (! $user instanceof User) {
                throw new ActionError(
                    message: 'Chưa xác thực.',
                    code: IdentityError::Unauthenticated,
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
