<?php

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Modules\Identity\Enums\IdentityError;

test('identity errors expose stable string declaration codes', function (): void {
    expect(IdentityError::InvalidCredentials->value)->toBe('IDENTITY-001');
});

test('identity errors expose their HTTP status through the shared declaration contract', function (): void {
    expect(IdentityError::InvalidCredentials)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(IdentityError::InvalidCredentials->httpStatus())->toBe(401);
});
