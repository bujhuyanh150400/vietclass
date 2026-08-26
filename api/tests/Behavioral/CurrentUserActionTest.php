<?php

use App\Core\Data\ActionResult;
use App\Modules\Identity\Actions\GetCurrentUserAction;
use App\Modules\Identity\Actions\LogoutAction;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\User;

test('current user action returns an unauthenticated failure result without a user', function (): void {
    $result = app(GetCurrentUserAction::class)->handle(user: null);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(IdentityError::Unauthenticated)
        ->and($result->getMessage())->toBe('Chưa xác thực.');
});

test('current user action returns the authenticated identity in a success result', function (): void {
    $user = new User(['username' => 'current-user']);

    $result = app(GetCurrentUserAction::class)->handle(user: $user);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeTrue()
        ->and($result->getData())->toBe($user);
});

test('logout action returns an unauthenticated failure result without a user', function (): void {
    $result = app(LogoutAction::class)->handle(user: null);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(IdentityError::Unauthenticated)
        ->and($result->getMessage())->toBe('Chưa xác thực.');
});
