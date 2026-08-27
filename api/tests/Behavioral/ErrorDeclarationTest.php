<?php

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Modules\Auth\Enums\AuthError;

test('auth errors expose stable string declaration codes', function (): void {
    expect(AuthError::InvalidCredentials->value)->toBe('AUTH-001');
});

test('auth errors expose their HTTP status through the shared declaration contract', function (): void {
    expect(AuthError::InvalidCredentials)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(AuthError::InvalidCredentials->httpStatus())->toBe(401);
});
