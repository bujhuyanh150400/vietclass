<?php

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\AcademicFeature;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleFeature;

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

test('schedule errors expose stable declarations and HTTP statuses', function (): void {
    expect(ScheduleError::ScheduleTemplateNotFound)
        ->toBeInstanceOf(ErrorDeclarationEnum::class);

    $statuses = collect(ScheduleError::cases())
        ->mapWithKeys(fn (ScheduleError $error): array => [$error->value => $error->httpStatus()])
        ->all();

    expect($statuses)->toBe([
        'SCHEDULE-001' => 404,
        'SCHEDULE-002' => 409,
        'SCHEDULE-003' => 409,
        'SCHEDULE-004' => 422,
        'SCHEDULE-005' => 422,
        'SCHEDULE-006' => 422,
        'SCHEDULE-007' => 422,
        'SCHEDULE-008' => 422,
        'SCHEDULE-009' => 422,
        'SCHEDULE-010' => 409,
        'SCHEDULE-011' => 422,
        'SCHEDULE-012' => 409,
        'SCHEDULE-013' => 422,
        'SCHEDULE-014' => 404,
        'SCHEDULE-015' => 422,
        'SCHEDULE-016' => 422,
    ]);
});

test('reading the schedule is open to teachers while every write stays with administrators', function (): void {
    $features = collect(ScheduleFeature::cases())->keyBy->value;

    // Fixed schedules have no detail permission: the spec gives them no per-record read
    // endpoint, so the list is the whole read surface. Sessions do have one, because a
    // single lesson is addressable once it has been materialised.
    expect($features->keys()->all())->toBe([
        'schedule.template.list',
        'schedule.template.create',
        'schedule.template.update',
        'schedule.template.delete',
        'schedule.session.list',
        'schedule.session.view',
        'schedule.session.manage',
    ]);

    $readable = ['schedule.template.list', 'schedule.session.list', 'schedule.session.view'];

    $features
        ->only($readable)
        ->each(fn (ScheduleFeature $feature) => expect($feature->defaultRoles())
            ->toBe([UserRole::Admin, UserRole::Teacher]));

    $features
        ->except($readable)
        ->each(fn (ScheduleFeature $feature) => expect($feature->defaultRoles())->toBe([UserRole::Admin]));

    expect($features['schedule.template.list']->group())->toBe('schedule')
        ->and($features['schedule.template.list']->label())->toBe('Xem danh sách lịch cố định')
        ->and($features['schedule.session.list']->label())->toBe('Xem lịch học theo khoảng ngày');
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
