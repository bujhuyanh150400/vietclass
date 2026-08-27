<?php

namespace App\Modules\Auth\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Identity\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

final class GetCurrentUserAction
{
    /**
     * Resolve the authenticated identity into a result without leaking expected errors to the controller.
     *
     * @return ActionResult<User, AuthError>
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

            return ActionResult::success(data: $user);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
