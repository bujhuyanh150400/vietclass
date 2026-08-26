<?php

namespace App\Modules\Identity\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

enum IdentityError: string implements ErrorDeclarationEnum
{
    /** Credentials do not match an active identity account. */
    case InvalidCredentials = 'IDENTITY-001';

    /** No authenticated identity is available for the current request. */
    case Unauthenticated = 'IDENTITY-002';

    /**
     * Return the unauthorized status for invalid login credentials.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::InvalidCredentials, self::Unauthenticated => 401,
        };
    }
}
