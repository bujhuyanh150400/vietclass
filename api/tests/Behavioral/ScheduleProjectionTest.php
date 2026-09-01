<?php

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\ListScheduleSessionsAction;
use App\Modules\Schedule\Actions\ResolveScheduleSessionAction;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleInstanceTeacher;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Support\ProjectedSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

/** The Monday of the week `$weeks` weeks from the current one. */
function calendarMonday(int $weeks = 0): string
{
    return Carbon::today()->startOfWeek()->addWeeks($weeks)->toDateString();
}

/** The day `$days` days after a given date. */
function calendarDay(string $from, int $days): string
{
    return Carbon::parse($from)->addDays($days)->toDateString();
}

function calendarUrl(array $query): string
{
    return '/api/v1/schedule-sessions?'.http_build_query($query);
}

/**
 * @return list<string>
 */
function calendarDates(string $from, string $to, ?int $classId = null): array
{
    $sessions = app(ListScheduleSessionsAction::class)
        ->handle(from: $from, to: $to, classId: $classId)
        ->getData();

    return array_map(static fn (ProjectedSession $session): string => $session->date, $sessions);
}

/**
 * @return list<ProjectedSession>
 */
function calendarSessions(string $from, string $to, ?int $classId = null): array
{
    return app(ListScheduleSessionsAction::class)
        ->handle(from: $from, to: $to, classId: $classId)
        ->getData();
}

/**
 * Open a Monday morning slot for a fresh class with its own room and its own two people,
 * so several of these can coexist without clashing.
 *
 * @return array{0: ScheduleTemplate, 1: SchoolClass, 2: TeacherProfile, 3: TeacherProfile}
 */
function calendarSchedule(User $actor): array
{
    $class = SchoolClass::factory()->create(['start_at' => calendarMonday(-4)]);
    $room = Room::factory()->create();
    $main = TeacherProfile::factory()->create();
    $assistant = TeacherProfile::factory()->create();

    $template = app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        [
            'room_id' => $room->id,
            'day_of_week' => DayOfWeek::Monday->value,
            'start_time' => '08:00',
            'end_time' => '09:30',
            'start_date' => calendarMonday(),
        ],
        [
            ['teacher_profile_id' => (int) $main->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
            ['teacher_profile_id' => (int) $assistant->profile_id, 'role' => ScheduleTeacherRole::Assistant->value],
        ],
        (int) $actor->id,
    )->getData();

    return [$template, $class, $main, $assistant];
}

function materialise(int $templateId, string $date, int $actorId): int
{
    return (int) app(ResolveScheduleSessionAction::class)
        ->handle(templateId: $templateId, date: $date, actorId: $actorId)
        ->getData()
        ->id;
}

test('the projection lands on matching weekdays inside the window of the fixed schedule', function (): void {
    $class = SchoolClass::factory()->create(['start_at' => calendarMonday(-6), 'end_at' => null]);
    ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_date' => calendarMonday(1),
        'end_date' => calendarMonday(4),
    ]);

    expect(calendarDates(calendarMonday(-1), calendarMonday(6)))
        ->toBe([calendarMonday(1), calendarMonday(2), calendarMonday(3), calendarMonday(4)])
        // Nothing lands on any other weekday, so a week read from Tuesday onwards is empty
        // even though the schedule applies right through it.
        ->and(calendarDates(calendarDay(calendarMonday(2), 1), calendarDay(calendarMonday(2), 6)))
        ->toBe([]);
});

test('the projection is bounded by the dates of the class just as it is by the schedule', function (): void {
    $class = SchoolClass::factory()->create(['start_at' => calendarMonday(2), 'end_at' => calendarMonday(3)]);
    ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_date' => calendarMonday(-1),
        'end_date' => calendarMonday(6),
    ]);

    // The schedule reaches every Monday in the range asked for; the class does not exist
    // for most of them, and that is what decides the answer.
    expect(calendarDates(calendarMonday(-1), calendarMonday(6)))
        ->toBe([calendarMonday(2), calendarMonday(3)]);
});

test('a fixed schedule with no closing date runs until its class ends', function (): void {
    $ending = SchoolClass::factory()->create(['start_at' => calendarMonday(-6), 'end_at' => calendarMonday(2)]);
    ScheduleTemplate::factory()->create([
        'class_id' => $ending->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_date' => calendarMonday(),
        'end_date' => null,
    ]);

    $openEnded = SchoolClass::factory()->create(['start_at' => calendarMonday(-6), 'end_at' => null]);
    ScheduleTemplate::factory()->create([
        'class_id' => $openEnded->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_date' => calendarMonday(),
        'end_date' => null,
    ]);

    expect(calendarDates(calendarMonday(), calendarMonday(6), (int) $ending->id))
        ->toBe([calendarMonday(), calendarMonday(1), calendarMonday(2)])
        // With no upper bound on either side the schedule reaches the whole range asked
        // for, which is what makes the range limit the thing that keeps a read finite.
        ->and(calendarDates(calendarMonday(), calendarMonday(6), (int) $openEnded->id))
        ->toHaveCount(7);
});

test('a written row replaces its projected twin and no date ever carries both', function (): void {
    [$template, $class] = calendarSchedule($this->admin);
    $on = calendarMonday(1);

    $writtenId = materialise((int) $template->id, $on, (int) $this->admin->id);
    $sessions = calendarSessions(calendarMonday(), calendarMonday(2), (int) $class->id);
    $thatDate = array_values(array_filter($sessions, static fn (ProjectedSession $s): bool => $s->date === $on));

    expect($sessions)->toHaveCount(3)
        // Exactly one session exists for the materialised date. The projected twin is
        // dropped, not merged into it and not reported beside it.
        ->and($thatDate)->toHaveCount(1)
        ->and($thatDate[0]->id)->toBe($writtenId)
        ->and(array_filter($sessions, static fn (ProjectedSession $s): bool => $s->isMaterialised()))
        ->toHaveCount(1);

    $this->assertDatabaseCount('schedule_instances', 1);
});

test('a projected session carries the teachers of its schedule and a written one carries its own', function (): void {
    [$template, $class, $main, $assistant] = calendarSchedule($this->admin);
    $standIn = TeacherProfile::factory()->create();
    $on = calendarMonday(1);

    $writtenId = materialise((int) $template->id, $on, (int) $this->admin->id);

    // Only a written session can record a substitution: a fixed schedule says who is
    // meant to teach, while standing in for somebody is a fact about one particular day.
    ScheduleInstanceTeacher::query()
        ->where('schedule_instance_id', $writtenId)
        ->where('teacher_profile_id', $assistant->profile_id)
        ->update([
            'teacher_profile_id' => $standIn->profile_id,
            'replaces_profile_id' => $assistant->profile_id,
        ]);

    $sessions = collect(calendarSessions(calendarMonday(), calendarMonday(2), (int) $class->id))
        ->keyBy(static fn (ProjectedSession $session): string => $session->date);

    $written = collect($sessions[$on]->teachers);
    $projected = collect($sessions[calendarMonday(2)]->teachers);

    expect($written->pluck('teacher_profile_id')->sort()->values()->all())
        ->toBe(collect([(int) $main->profile_id, (int) $standIn->profile_id])->sort()->values()->all())
        ->and($written->pluck('replaces_profile_id')->filter()->values()->all())
        ->toBe([(int) $assistant->profile_id])
        // The projected sessions still read from the schedule, so they are untouched by
        // what happened on that one day.
        ->and($projected->pluck('teacher_profile_id')->sort()->values()->all())
        ->toBe(collect([(int) $main->profile_id, (int) $assistant->profile_id])->sort()->values()->all())
        ->and($projected->pluck('replaces_profile_id')->unique()->values()->all())->toBe([null])
        ->and($projected->pluck('role')->map(fn (ScheduleTeacherRole $role): int => $role->value)->sort()->values()->all())
        ->toBe([ScheduleTeacherRole::MainTeacher->value, ScheduleTeacherRole::Assistant->value]);
});

test('the calendar endpoint reports a projected session with no identifier and a written one with its own', function (): void {
    [$template, $class] = calendarSchedule($this->admin);
    $on = calendarMonday(1);
    $range = ['from' => calendarMonday(), 'to' => $on, 'class_id' => (int) $class->id];

    $projected = $this->getJson(calendarUrl($range))
        ->assertOk()
        ->assertJsonCount(2, 'data')
        // A projected session has no row, so it has no identifier, and none is invented
        // for it: the pair beside the null is what addresses it.
        ->assertJsonPath('data.0.id', null)
        ->assertJsonPath('data.0.template_id', (int) $template->id)
        ->assertJsonPath('data.0.date', calendarMonday())
        ->assertJsonPath('data.0.class_id', (int) $class->id)
        ->assertJsonPath('data.0.subject_id', (int) $class->subject_id)
        ->assertJsonPath('data.0.room_id', (int) $template->room_id)
        ->assertJsonPath('data.0.start_time', '08:00')
        ->assertJsonPath('data.0.end_time', '09:30')
        ->assertJsonPath('data.0.schedule_type_label', 'Lịch chính')
        ->assertJsonPath('data.0.status_label', 'Chưa diễn ra')
        ->assertJsonPath('data.0.is_customized', false)
        ->assertJsonPath('data.0.note', null)
        ->assertJsonCount(2, 'data.0.teachers')
        ->assertJsonStructure([
            'data' => [[
                'id', 'template_id', 'class_id', 'subject_id', 'date', 'start_time', 'end_time',
                'room_id', 'schedule_type', 'schedule_type_label', 'status', 'status_label',
                'is_customized', 'note', 'teachers',
            ]],
        ]);

    expect(collect($projected->json('data.0.teachers'))->pluck('role')->sort()->values()->all())
        ->toBe([ScheduleTeacherRole::MainTeacher->value, ScheduleTeacherRole::Assistant->value])
        ->and(collect($projected->json('data.0.teachers'))->pluck('role_label')->sort()->values()->all())
        ->toBe(['Giáo viên chính', 'Trợ giảng'])
        ->and(collect($projected->json('data.0.teachers'))->pluck('replaces_profile_id')->unique()->values()->all())
        ->toBe([null]);

    $writtenId = $this->postJson('/api/v1/schedule-sessions/resolve', [
        'template_id' => (int) $template->id,
        'date' => $on,
    ])
        ->assertOk()
        ->assertJsonPath('data.template_id', (int) $template->id)
        ->assertJsonPath('data.date', $on)
        ->assertJsonPath('data.is_customized', true)
        ->json('data.id');

    expect($writtenId)->toBeInt();

    // The same lesson now reads back with an identifier, in the same shape and the same
    // place in the calendar.
    $this->getJson(calendarUrl($range))
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.id', null)
        ->assertJsonPath('data.1.id', $writtenId)
        ->assertJsonPath('data.1.date', $on);

    $this->getJson("/api/v1/schedule-sessions/{$writtenId}")
        ->assertOk()
        ->assertJsonPath('data.id', $writtenId)
        ->assertJsonPath('data.date', $on)
        ->assertJsonPath('data.start_time', '08:00')
        ->assertJsonCount(2, 'data.teachers');

    $this->getJson('/api/v1/schedule-sessions/'.($writtenId + 1000))
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy buổi học.');
});

test('materialising through the endpoint is idempotent and a date the projection misses is refused', function (): void {
    [$template] = calendarSchedule($this->admin);
    $on = calendarMonday(1);
    $tuesday = calendarDay($on, 1);
    $payload = ['template_id' => (int) $template->id, 'date' => $on];

    $first = $this->postJson('/api/v1/schedule-sessions/resolve', $payload)->assertOk();
    $second = $this->postJson('/api/v1/schedule-sessions/resolve', $payload)->assertOk();

    expect($second->json('data.id'))->toBe($first->json('data.id'));

    $this->assertDatabaseCount('schedule_instances', 1);
    $this->assertDatabaseCount('schedule_instance_teachers', 2);

    // A date the fixed schedule does not project onto cannot be invented into existence.
    $this->postJson('/api/v1/schedule-sessions/resolve', ['template_id' => (int) $template->id, 'date' => $tuesday])
        ->assertStatus(422)
        ->assertJsonPath('message', "Lịch cố định không có buổi học nào vào ngày {$tuesday}.");

    $this->postJson('/api/v1/schedule-sessions/resolve', ['template_id' => (int) $template->id + 1000, 'date' => $on])
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lịch cố định.');

    // Shape problems arrive on the field rather than as a business failure.
    $this->postJson('/api/v1/schedule-sessions/resolve', ['template_id' => (int) $template->id, 'date' => '01-09-2026'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['date']);

    $this->postJson('/api/v1/schedule-sessions/resolve', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['template_id', 'date']);
});

test('the calendar endpoint requires both bounds, refuses a backwards range, and caps the width', function (): void {
    calendarSchedule($this->admin);
    $from = calendarMonday();

    $this->getJson('/api/v1/schedule-sessions')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['from', 'to']);

    $this->getJson(calendarUrl(['from' => $from, 'to' => calendarDay($from, -1)]))
        ->assertStatus(422)
        ->assertJsonPath('errors.to.0', 'Ngày kết thúc không được trước ngày bắt đầu.');

    // The limit counts both bounds, so ninety-two days is the widest range allowed and
    // ninety-three is the first one refused.
    $this->getJson(calendarUrl(['from' => $from, 'to' => calendarDay($from, 91)]))->assertOk();

    $this->getJson(calendarUrl(['from' => $from, 'to' => calendarDay($from, 92)]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Khoảng ngày không được rộng hơn 92 ngày.');
});

// One identity per test from here on. The auth guard memoises the caller it resolved and
// the test process keeps that guard between requests, so a test that speaks first as one
// person and then as another is silently answered as the first one throughout. Fixtures
// belonging to somebody else are therefore built through Actions rather than over HTTP.
test('a teacher reads only the sessions they are on and cannot materialise any', function (): void {
    [$template, $ownClass, $main] = calendarSchedule($this->admin);
    [$otherTemplate, , $otherMain] = calendarSchedule($this->admin);
    $range = ['from' => calendarMonday(), 'to' => calendarMonday(2)];
    $strangerSession = materialise((int) $otherTemplate->id, calendarMonday(1), (int) $this->admin->id);

    $this->withToken($main->profile->user->createToken('test')->plainTextToken);
    $mine = $this->getJson(calendarUrl($range))->assertOk();

    // Every one of these lessons is still only projected, so the narrowing has to reach
    // projected sessions and not just written rows.
    expect(collect($mine->json('data'))->pluck('class_id')->unique()->values()->all())
        ->toBe([(int) $ownClass->id])
        ->and($mine->json('data'))->toHaveCount(3)
        ->and(collect($mine->json('data'))->pluck('id')->unique()->values()->all())->toBe([null]);

    // Somebody else's lesson is reported as not found rather than as forbidden, because
    // saying it exists but is not theirs would leak the lesson.
    $this->getJson("/api/v1/schedule-sessions/{$strangerSession}")
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy buổi học.');

    // Filtering on somebody else is answered with an empty calendar rather than theirs.
    $this->getJson(calendarUrl([...$range, 'teacher_id' => (int) $otherMain->profile_id]))
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->postJson('/api/v1/schedule-sessions/resolve', [
        'template_id' => (int) $template->id,
        'date' => calendarMonday(1),
    ])->assertForbidden();
});

test('an assistant sees the lessons they assist at through the calendar endpoint', function (): void {
    [, $ownClass, , $assistant] = calendarSchedule($this->admin);
    calendarSchedule($this->admin);

    $this->withToken($assistant->profile->user->createToken('test')->plainTextToken);
    $mine = $this->getJson(calendarUrl(['from' => calendarMonday(), 'to' => calendarMonday(2)]))->assertOk();

    // An assistant is present at the lesson, so the lesson is theirs to see; the read
    // scope never reads a role.
    expect(collect($mine->json('data'))->pluck('class_id')->unique()->values()->all())
        ->toBe([(int) $ownClass->id])
        ->and($mine->json('data'))->toHaveCount(3);
});

test('an unauthenticated caller reaches no session endpoint', function (): void {
    $this->withToken('');

    $this->getJson(calendarUrl(['from' => calendarMonday(), 'to' => calendarMonday()]))->assertUnauthorized();
    $this->postJson('/api/v1/schedule-sessions/resolve', [])->assertUnauthorized();
    $this->getJson('/api/v1/schedule-sessions/1')->assertUnauthorized();
});

test('the calendar costs the same four queries whether it covers one day or a quarter', function (): void {
    [$first] = calendarSchedule($this->admin);
    [$second] = calendarSchedule($this->admin);
    $opensOn = calendarMonday(1);

    // Both sets have to be non-empty in every range measured. An empty parent collection
    // skips its eager load, and a count that fell for that reason would say nothing about
    // whether the range drives the number of queries.
    materialise((int) $first->id, $opensOn, (int) $this->admin->id);
    materialise((int) $second->id, $opensOn, (int) $this->admin->id);

    $action = app(ListScheduleSessionsAction::class);
    DB::enableQueryLog();

    $measure = static function (int $days) use ($action, $opensOn): array {
        DB::flushQueryLog();
        $sessions = $action->handle(from: $opensOn, to: calendarDay($opensOn, $days - 1))->getData();

        return [count(DB::getQueryLog()), count($sessions)];
    };

    [$oneDay, $oneDaySessions] = $measure(1);
    [$oneWeek] = $measure(7);
    [$quarter, $quarterSessions] = $measure(92);

    DB::disableQueryLog();

    // Two queries for the written rows with their teachers, two for the fixed schedules
    // with theirs, and arithmetic for the rest. A count that grew with the range would
    // mean the day walk had started asking the database questions.
    expect($oneDay)->toBe(4)
        ->and($oneWeek)->toBe(4)
        ->and($quarter)->toBe(4)
        ->and($oneDaySessions)->toBe(2)
        // Constant, and not because the wide range came back empty.
        ->and($quarterSessions)->toBeGreaterThan(20);
});

test('the calendar endpoint asks the database no more for a quarter than for a single day', function (): void {
    [$template] = calendarSchedule($this->admin);
    $opensOn = calendarMonday(1);
    materialise((int) $template->id, $opensOn, (int) $this->admin->id);

    $narrowRange = ['from' => $opensOn, 'to' => $opensOn];
    $wideRange = ['from' => $opensOn, 'to' => calendarDay($opensOn, 91)];

    // One warm-up request first: permissions are resolved once per user for the lifetime
    // of the process, so the very first request pays for something no later one does.
    $this->getJson(calendarUrl($narrowRange))->assertOk();

    DB::enableQueryLog();
    $this->getJson(calendarUrl($narrowRange))->assertOk();
    $narrow = count(DB::getQueryLog());

    DB::flushQueryLog();
    $wide = $this->getJson(calendarUrl($wideRange))->assertOk();
    $wideQueries = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($wideQueries)->toBe($narrow)
        ->and($wide->json('data'))->toHaveCount(14);
});
