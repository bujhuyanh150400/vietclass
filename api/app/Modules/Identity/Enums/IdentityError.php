<?php

namespace App\Modules\Identity\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

enum IdentityError: string implements ErrorDeclarationEnum
{
    /** No teacher profile carries the given identifier. */
    case TeacherNotFound = 'IDENTITY-001';

    /** No student profile carries the given identifier. */
    case StudentNotFound = 'IDENTITY-002';

    /** The profile is not linked to a login account, so it has none to change. */
    case AccountNotProvisioned = 'IDENTITY-003';

    /**
     * Return the HTTP status this business failure reaches the API boundary with.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::TeacherNotFound, self::StudentNotFound => 404,
            self::AccountNotProvisioned => 409,
        };
    }
}
