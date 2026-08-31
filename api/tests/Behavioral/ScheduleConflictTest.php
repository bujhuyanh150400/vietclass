<?php

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\ReviseScheduleTemplateAction;
use App\Modules\Schedule\Actions\SetScheduleTemplateTeachersAction;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

/**
 * @return array{0: SchoolClass, 1: Room, 2: TeacherProfile}
 */
function conflictContext(): array
{
    return [
        SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]),
        Room::factory()->create(),
        TeacherProfile::factory()->create(),
    ];
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function conflictSlot(Room $room, array $overrides = []): array
{
    return [
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '08:00',
        'end_time' => '09:30',
        'start_date' => now()->toDateString(),
        ...$overrides,
    ];
}

/**
 * @return list<array{teacher_profile_id: int, role: int}>
 */
function conflictRoster(TeacherProfile ...$teachers): array
{
    return array_map(
        static fn (TeacherProfile $teacher, int $index): array => [
            'teacher_profile_id' => (int) $teacher->profile_id,
            'role' => $index === 0 ? ScheduleTeacherRole::MainTeacher->value : ScheduleTeacherRole::Assistant->value,
        ],
        $teachers,
        array_keys($teachers),
    );
}

test('the same room at the same weekday and overlapping time is refused', function (): void {
    [$class, $room, $main] = conflictContext();
    $other = TeacherProfile::factory()->create();
    $actor = (int) $this->admin->id;
    $action = app(CreateScheduleTemplateAction::class);

    $action->handle((int) $class->id, conflictSlot($room), conflictRoster($main), $actor);

    $sameSlot = $action->handle(
        (int) $class->id,
        conflictSlot($room),
        conflictRoster($other),
        $actor,
    );

    $partialOverlap = $action->handle(
        (int) $class->id,
        conflictSlot($room, ['start_time' => '09:00', 'end_time' => '10:30']),
        conflictRoster($other),
        $actor,
    );

    expect($sameSlot->getError())->toBe(ScheduleError::RoomConflict)
        ->and($partialOverlap->getError())->toBe(ScheduleError::RoomConflict)
        ->and($partialOverlap->getMessage())->toContain('Phòng học đã có lịch cố định của lớp')
        ->and($partialOverlap->getMessage())->toContain('Thứ 2 08:00–09:30');

    $this->assertDatabaseCount('schedule_templates', 1);
});

test('a touching time range, another weekday, and a disjoint date range all pass', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;
    $action = app(CreateScheduleTemplateAction::class);

    $action->handle((int) $class->id, conflictSlot($room, [
        'end_date' => now()->addWeek()->toDateString(),
    ]), conflictRoster($main), $actor);

    $touching = $action->handle((int) $class->id, conflictSlot($room, [
        'start_time' => '09:30',
        'end_time' => '11:00',
    ]), conflictRoster($main), $actor);

    $otherDay = $action->handle((int) $class->id, conflictSlot($room, [
        'day_of_week' => DayOfWeek::Tuesday->value,
    ]), conflictRoster($main), $actor);

    $laterWindow = $action->handle((int) $class->id, conflictSlot($room, [
        'start_date' => now()->addWeeks(2)->toDateString(),
    ]), conflictRoster($main), $actor);

    expect($touching->isSuccess())->toBeTrue()
        ->and($otherDay->isSuccess())->toBeTrue()
        ->and($laterWindow->isSuccess())->toBeTrue();

    $this->assertDatabaseCount('schedule_templates', 4);
});

test('a person who is main teacher on one schedule and assistant on another clashing one is refused', function (): void {
    [$classOne, $roomOne, $shared] = conflictContext();
    $classTwo = SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]);
    $roomTwo = Room::factory()->create();
    $otherMain = TeacherProfile::factory()->create();
    $actor = (int) $this->admin->id;
    $action = app(CreateScheduleTemplateAction::class);

    $action->handle((int) $classOne->id, conflictSlot($roomOne), conflictRoster($shared), $actor);

    $result = $action->handle(
        (int) $classTwo->id,
        conflictSlot($roomTwo, ['start_time' => '09:00', 'end_time' => '10:30']),
        conflictRoster($otherMain, $shared),
        $actor,
    );

    expect($result->getError())->toBe(ScheduleError::TeacherConflict)
        ->and($result->getMessage())->toContain('Giáo viên đã có lịch cố định của lớp');

    $this->assertDatabaseCount('schedule_templates', 1);
});

test('an open ended schedule blocks a later window', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;
    $action = app(CreateScheduleTemplateAction::class);

    $action->handle((int) $class->id, conflictSlot($room), conflictRoster($main), $actor);

    $later = $action->handle((int) $class->id, conflictSlot($room, [
        'start_date' => now()->addYear()->toDateString(),
    ]), conflictRoster($main), $actor);

    expect($later->getError())->toBe(ScheduleError::RoomConflict);
});

test('a revision does not clash with the version it replaces', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, conflictSlot($room), conflictRoster($main), $actor)
        ->getData();

    $result = app(ReviseScheduleTemplateAction::class)->handle(
        (int) $created->id,
        now()->addWeek()->toDateString(),
        [
            'room_id' => $room->id,
            'day_of_week' => DayOfWeek::Monday->value,
            'start_time' => '08:00',
            'end_time' => '09:30',
        ],
        conflictRoster($main),
        $actor,
    );

    expect($result->isSuccess())->toBeTrue();
});

test('moving a teacher into a slot they already occupy elsewhere is refused', function (): void {
    [$classOne, $roomOne, $busy] = conflictContext();
    $classTwo = SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]);
    $roomTwo = Room::factory()->create();
    $free = TeacherProfile::factory()->create();
    $actor = (int) $this->admin->id;
    $action = app(CreateScheduleTemplateAction::class);

    $action->handle((int) $classOne->id, conflictSlot($roomOne), conflictRoster($busy), $actor);

    $second = $action->handle((int) $classTwo->id, conflictSlot($roomTwo), conflictRoster($free), $actor)
        ->getData();

    $result = app(SetScheduleTemplateTeachersAction::class)
        ->handle((int) $second->id, conflictRoster($busy), $actor);

    expect($result->getError())->toBe(ScheduleError::TeacherConflict);

    $this->assertDatabaseHas('schedule_template_teachers', [
        'schedule_template_id' => $second->id,
        'teacher_profile_id' => $free->profile_id,
    ]);
});

test('the room conflict reaches the caller as a 409 through the endpoint', function (): void {
    [$class, $room, $main] = conflictContext();
    $other = TeacherProfile::factory()->create();

    app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, conflictSlot($room), conflictRoster($main), (int) $this->admin->id);

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...conflictSlot($room, ['start_time' => '09:00', 'end_time' => '10:30']),
        'teachers' => conflictRoster($other),
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', fn (string $message): bool => str_contains($message, 'Phòng học đã có'));

    $this->assertDatabaseCount('schedule_templates', 1);
});
