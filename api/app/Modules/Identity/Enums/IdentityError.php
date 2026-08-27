<?php

namespace App\Modules\Identity\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

enum IdentityError: string implements ErrorDeclarationEnum
{
    /** No teacher profile carries the given identifier. */
    case TeacherNotFound = 'IDENTITY-001';

    /** No student profile carries the given identifier. */
    case StudentNotFound = 'IDENTITY-002';

    /**
     * Return the not-found status for every declared identity lookup failure.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::TeacherNotFound, self::StudentNotFound => 404,
        };
    }
}
