<?php

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\AcademicFeature;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Auth\Enums\UserRole;

test('auth errors expose stable string declaration codes', function (): void {
    expect(AuthError::InvalidCredentials->value)->toBe('AUTH-001');
});

test('auth errors expose their HTTP status through the shared declaration contract', function (): void {
    expect(AuthError::InvalidCredentials)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(AuthError::InvalidCredentials->httpStatus())->toBe(401);
});

test('academic room errors expose stable declarations and HTTP statuses', function (): void {
    expect(AcademicError::RoomNotFound)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(AcademicError::RoomNotFound->value)->toBe('ACADEMIC-018')
        ->and(AcademicError::RoomNotFound->httpStatus())->toBe(404)
        ->and(AcademicError::RoomInUse->value)->toBe('ACADEMIC-019')
        ->and(AcademicError::RoomInUse->httpStatus())->toBe(409)
        ->and(AcademicError::RoomInactive->value)->toBe('ACADEMIC-020')
        ->and(AcademicError::RoomInactive->httpStatus())->toBe(422);
});

test('the guardian lookup failure exposes a stable declaration and HTTP status', function (): void {
    expect(AcademicPersonError::GuardianNotFound)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(AcademicPersonError::GuardianNotFound->value)->toBe('IDENTITY-007')
        ->and(AcademicPersonError::GuardianNotFound->httpStatus())->toBe(404);
});

test('the guardian directory permission is available to administrators by default', function (): void {
    $features = collect(AcademicFeature::cases())->keyBy->value;

    expect($features->keys()->all())->toContain('guardian.list')
        ->and($features['guardian.list']->defaultRoles())->toBe([UserRole::Admin])
        ->and($features['guardian.list']->group())->toBe('guardian');
});

test('academic room permissions are available to administrators by default', function (): void {
    $features = collect(AcademicFeature::cases())->keyBy->value;

    expect($features->keys()->all())
        ->toContain(
            'room.list',
            'room.view',
            'room.create',
            'room.update',
            'room.change_status',
            'room.delete',
        );

    expect($features['room.list']->defaultRoles())->toBe([UserRole::Admin]);
});
