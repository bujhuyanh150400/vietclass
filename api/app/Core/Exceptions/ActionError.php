<?php

namespace App\Core\Exceptions;

use App\Core\Contracts\ErrorDeclarationEnum;
use RuntimeException;

final class ActionError extends RuntimeException
{
    private readonly ErrorDeclarationEnum $actionCode;

    /**
     * Create a safe, expected business error that an Action can convert into an ActionResult.
     */
    public function __construct(
        string $message,
        ErrorDeclarationEnum $code,
    ) {
        $this->actionCode = $code;
        parent::__construct($message);
    }

    /**
     * Return the module-owned code used to classify this business failure.
     */
    public function code(): ErrorDeclarationEnum
    {
        return $this->actionCode;
    }
}
