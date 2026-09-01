<?php

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Actions\CloseScheduleTemplateAction;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\ResolveScheduleSessionAction;
use App\Modules\Schedule\Actions\ReviseScheduleTemplateAction;
use App\Modules\Schedule\Actions\SetScheduleTemplateTeachersAction;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleInstanceTeacher;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Support\ScheduleConflictChecker;
use Illuminate\Support\Carbon;

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

/**
 * Run something that may refuse a slot and hand back the refusal, or null when the slot
 * was accepted. The three comparisons added in this phase have no Action calling them
 * yet — the write paths for sessions arrive in the next phase — so they are exercised
 * through the checker itself.
 */
function refusalFrom(Closure $attempt): ?ActionError
{
    try {
        $attempt();

        return null;
    } catch (ActionError $error) {
        return $error;
    }
}

/** The next Monday comfortably inside the windows the helpers above open. */
function conflictMonday(): string
{
    return Carbon::today()->addWeek()->startOfWeek()->toDateString();
}

/**
 * Write a session directly, with the given teachers attached, so a comparison has a real
 * row to be held against without a session-writing Action existing yet.
 *
 * @param  array<string, mixed>  $overrides
 */
function writtenSession(array $overrides, TeacherProfile ...$teachers): ScheduleInstance
{
    $session = ScheduleInstance::factory()->create([
        'date' => conflictMonday(),
        'start_time' => '08:00:00',
        'end_time' => '09:30:00',
        ...$overrides,
    ]);

    foreach ($teachers as $index => $teacher) {
        ScheduleInstanceTeacher::factory()->create([
            'schedule_instance_id' => $session->id,
            'teacher_profile_id' => $teacher->profile_id,
            'role' => $index === 0 ? ScheduleTeacherRole::MainTeacher : ScheduleTeacherRole::Assistant,
        ]);
    }

    return $session;
}

test('a written session blocks a weekly slot that would land on its room', function (): void {
    [$class, $room, $main] = conflictContext();
    $checker = app(ScheduleConflictChecker::class);

    writtenSession(['class_id' => $class->id, 'room_id' => $room->id]);

    $refusal = refusalFrom(fn () => $checker->assertTemplateSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        dayOfWeek: DayOfWeek::Monday,
        startTime: '09:00:00',
        endTime: '10:30:00',
        startDate: Carbon::today()->toDateString(),
        endDate: null,
        teacherProfileIds: [(int) $main->profile_id],
    ));

    expect($refusal?->code())->toBe(ScheduleError::RoomConflict)
        ->and($refusal?->getMessage())->toContain('Phòng học đã có buổi học của lớp')
        ->and($refusal?->getMessage())->toContain(Carbon::parse(conflictMonday())->format('d/m/Y'));
});

test('a weekly slot is only held against written sessions on its own weekday and inside its window', function (): void {
    [$class, $room, $main] = conflictContext();
    $checker = app(ScheduleConflictChecker::class);

    // Same room and same time, but a Tuesday: the weekday predicate is what keeps a
    // recurrence from being compared against every row in its window.
    writtenSession([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'date' => Carbon::parse(conflictMonday())->addDay()->toDateString(),
    ]);

    // The right weekday, but after the slot stops applying.
    writtenSession([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'date' => Carbon::parse(conflictMonday())->addWeeks(4)->toDateString(),
    ]);

    // The right weekday inside the window, but called off, so it holds nothing.
    writtenSession([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'status' => ScheduleStatus::Cancelled,
    ]);

    $refusal = refusalFrom(fn () => $checker->assertTemplateSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        dayOfWeek: DayOfWeek::Monday,
        startTime: '08:00:00',
        endTime: '09:30:00',
        startDate: Carbon::today()->toDateString(),
        endDate: Carbon::parse(conflictMonday())->addWeek()->toDateString(),
        teacherProfileIds: [(int) $main->profile_id],
    ));

    expect($refusal)->toBeNull();
});

test('a weekly slot is refused when a written session in another room already has one of its people', function (): void {
    [$class, $room, $shared] = conflictContext();
    $otherRoom = Room::factory()->create();
    $checker = app(ScheduleConflictChecker::class);

    $session = writtenSession(
        ['class_id' => $class->id, 'room_id' => $otherRoom->id],
        TeacherProfile::factory()->create(),
        $shared,
    );

    $refusal = refusalFrom(fn () => $checker->assertTemplateSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        dayOfWeek: DayOfWeek::Monday,
        startTime: '08:00:00',
        endTime: '09:30:00',
        startDate: Carbon::today()->toDateString(),
        endDate: null,
        teacherProfileIds: [(int) $shared->profile_id],
    ));

    // The shared person assists rather than leads, which changes nothing.
    expect($refusal?->code())->toBe(ScheduleError::TeacherConflict)
        ->and($session->teachers()->where('teacher_profile_id', $shared->profile_id)->value('role'))
        ->toBe(ScheduleTeacherRole::Assistant);

    $ownRows = refusalFrom(fn () => $checker->assertTemplateSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        dayOfWeek: DayOfWeek::Monday,
        startTime: '08:00:00',
        endTime: '09:30:00',
        startDate: Carbon::today()->toDateString(),
        endDate: null,
        teacherProfileIds: [(int) $shared->profile_id],
        excludeTemplateId: (int) ScheduleTemplate::factory()->create([
            'class_id' => $class->id,
            'room_id' => $otherRoom->id,
        ])->id,
    ));

    // Excluding a schedule the session does not belong to changes nothing either.
    expect($ownRows?->code())->toBe(ScheduleError::TeacherConflict);
});

test('two written sessions cannot hold the same room or person at the same time', function (): void {
    [$class, $room, $shared] = conflictContext();
    $otherRoom = Room::factory()->create();
    $checker = app(ScheduleConflictChecker::class);

    $existing = writtenSession(['class_id' => $class->id, 'room_id' => $room->id], $shared);

    $roomClash = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '09:00:00',
        endTime: '10:30:00',
        teacherProfileIds: [],
    ));

    $teacherClash = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfWrittenSessions(
        roomId: (int) $otherRoom->id,
        date: conflictMonday(),
        startTime: '09:00:00',
        endTime: '10:30:00',
        teacherProfileIds: [(int) $shared->profile_id],
    ));

    $touching = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '09:30:00',
        endTime: '11:00:00',
        teacherProfileIds: [(int) $shared->profile_id],
    ));

    $itself = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '08:00:00',
        endTime: '09:30:00',
        teacherProfileIds: [(int) $shared->profile_id],
        excludeInstanceId: (int) $existing->id,
    ));

    expect($roomClash?->code())->toBe(ScheduleError::RoomConflict)
        ->and($teacherClash?->code())->toBe(ScheduleError::TeacherConflict)
        ->and($touching)->toBeNull()
        ->and($itself)->toBeNull();
});

test('a cancelled written session releases its room for another session', function (): void {
    [$class, $room] = conflictContext();
    $checker = app(ScheduleConflictChecker::class);

    writtenSession([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'status' => ScheduleStatus::Cancelled,
    ]);

    $refusal = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfWrittenSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '08:00:00',
        endTime: '09:30:00',
        teacherProfileIds: [],
    ));

    expect($refusal)->toBeNull();
});

test('a projected session holds its room and its people against a written session', function (): void {
    [$class, $room, $main] = conflictContext();
    $otherRoom = Room::factory()->create();
    $actor = (int) $this->admin->id;
    $checker = app(ScheduleConflictChecker::class);

    app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        conflictSlot($room),
        conflictRoster($main),
        $actor,
    );

    $roomClash = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfProjectedSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '09:00:00',
        endTime: '10:30:00',
        teacherProfileIds: [],
    ));

    $teacherClash = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfProjectedSessions(
        roomId: (int) $otherRoom->id,
        date: conflictMonday(),
        startTime: '09:00:00',
        endTime: '10:30:00',
        teacherProfileIds: [(int) $main->profile_id],
    ));

    $otherWeekday = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfProjectedSessions(
        roomId: (int) $room->id,
        date: Carbon::parse(conflictMonday())->addDay()->toDateString(),
        startTime: '08:00:00',
        endTime: '09:30:00',
        teacherProfileIds: [(int) $main->profile_id],
    ));

    expect($roomClash?->code())->toBe(ScheduleError::RoomConflict)
        ->and($roomClash?->getMessage())->toContain('lịch cố định của lớp')
        ->and($teacherClash?->code())->toBe(ScheduleError::TeacherConflict)
        ->and($otherWeekday)->toBeNull();
});

test('a date that already has a written session projects nothing to clash with', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;
    $checker = app(ScheduleConflictChecker::class);

    $template = app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        conflictSlot($room),
        conflictRoster($main),
        $actor,
    )->getData();

    // The written row replaces the projected session, so the projected one is gone and
    // whatever the written row now says is the business of the written-against-written
    // comparison. Without this exclusion a session would clash with its own twin.
    writtenSession([
        'class_id' => $class->id,
        'template_id' => $template->id,
        'room_id' => $room->id,
    ]);

    $refusal = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfProjectedSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '08:00:00',
        endTime: '09:30:00',
        teacherProfileIds: [(int) $main->profile_id],
    ));

    expect($refusal)->toBeNull();
});

test('a fixed schedule projects nothing past the day its class ends', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;
    $checker = app(ScheduleConflictChecker::class);

    app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        conflictSlot($room),
        conflictRoster($main),
        $actor,
    );

    $class->update(['end_at' => Carbon::parse(conflictMonday())->subDay()->toDateString()]);

    $refusal = refusalFrom(fn () => $checker->assertSessionSlotIsFreeOfProjectedSessions(
        roomId: (int) $room->id,
        date: conflictMonday(),
        startTime: '08:00:00',
        endTime: '09:30:00',
        teacherProfileIds: [(int) $main->profile_id],
    ));

    expect($refusal)->toBeNull();
});

test('closing a fixed schedule does not release the room for the lessons already written under it', function (): void {
    [$class, $room, $main] = conflictContext();
    $actor = (int) $this->admin->id;
    $monday = conflictMonday();

    $template = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, conflictSlot($room, ['day_of_week' => DayOfWeek::Monday->value]), conflictRoster($main), $actor)
        ->getData();

    app(ResolveScheduleSessionAction::class)->handle((int) $template->id, $monday, $actor);

    // The schedule stops applying before the lesson it already produced, so from here on
    // nothing but the written row knows that Monday is taken.
    app(CloseScheduleTemplateAction::class)->handle((int) $template->id, Carbon::today()->toDateString(), $actor);

    $result = app(CreateScheduleTemplateAction::class)->handle(
        (int) SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()])->id,
        conflictSlot($room, [
            'day_of_week' => DayOfWeek::Monday->value,
            'start_date' => Carbon::parse($monday)->toDateString(),
        ]),
        conflictRoster(TeacherProfile::factory()->create()),
        $actor,
    );

    expect($result->getError())->toBe(ScheduleError::RoomConflict)
        ->and($result->getMessage())->toContain('Phòng học đã có buổi học của lớp');

    $this->assertDatabaseCount('schedule_templates', 1);
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
