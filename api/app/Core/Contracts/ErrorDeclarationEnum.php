<?php

namespace App\Core\Contracts;

use BackedEnum;

/**
 * Defines the contract shared by string-backed business error declarations.
 */
interface ErrorDeclarationEnum extends BackedEnum
{
    /**
     * Return the HTTP status used when this business error reaches the API boundary.
     */
    public function httpStatus(): int;
}
