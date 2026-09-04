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

    /** No account carries the given identifier. */
    case UserNotFound = 'IDENTITY-004';

    /** No profile carries the given identifier. */
    case ProfileNotFound = 'IDENTITY-005';

    /** The authenticated account may not update this profile. */
    case ProfileForbidden = 'IDENTITY-006';

    /**
     * Return the HTTP status this business failure reaches the API boundary with.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::TeacherNotFound, self::StudentNotFound, self::UserNotFound, self::ProfileNotFound => 404,
            self::AccountNotProvisioned => 409,
            self::ProfileForbidden => 403,
        };
    }
}
