<?php

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\GetScheduleSessionAction;
use App\Modules\Schedule\Actions\ListScheduleSessionsAction;
use App\Modules\Schedule\Actions\ResolveScheduleSessionAction;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Enums\ScheduleType;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Support\ProjectedSession;
use Illuminate\Database\Events\TransactionBeginning;
use Illuminate\Database\Events\TransactionCommitted;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
});

/** The next Monday, which every fixed schedule in this file is opened on. */
function sessionMonday(): string
{
    return Carbon::today()->addWeek()->startOfWeek()->toDateString();
}

/**
 * Open a Monday morning slot for a fresh class and return the schedule, its class, and
 * the two people teaching it.
 *
 * The schedule is written through the Action rather than the factory so the teacher list
 * goes through the roster rules, which is what makes it a list worth copying.
 *
 * @return array{0: ScheduleTemplate, 1: SchoolClass, 2: TeacherProfile, 3: TeacherProfile}
 */
function mondaySchedule(User $actor, ?SchoolClass $class = null): array
{
    $class ??= SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]);
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
            'start_date' => now()->toDateString(),
        ],
        [
            ['teacher_profile_id' => (int) $main->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
            ['teacher_profile_id' => (int) $assistant->profile_id, 'role' => ScheduleTeacherRole::Assistant->value],
        ],
        (int) $actor->id,
    )->getData();

    return [$template, $class, $main, $assistant];
}

test('the calendar reads as one list of written rows and projected sessions', function (): void {
    [$template, $class] = mondaySchedule($this->admin);
    $monday = sessionMonday();

    app(ResolveScheduleSessionAction::class)->handle((int) $template->id, $monday, (int) $this->admin->id);

    $sessions = app(ListScheduleSessionsAction::class)->handle(
        from: Carbon::today()->toDateString(),
        to: Carbon::parse($monday)->addWeeks(2)->toDateString(),
        classId: (int) $class->id,
    )->getData();

    $byDate = collect($sessions)->keyBy(fn (ProjectedSession $session): string => $session->date);

    expect($sessions)->toHaveCount(3)
        ->and($byDate[$monday]->isMaterialised())->toBeTrue()
        ->and($byDate[Carbon::parse($monday)->addWeek()->toDateString()]->id)->toBeNull()
        ->and($byDate[Carbon::parse($monday)->addWeeks(2)->toDateString()]->id)->toBeNull()
        // Every session reports the same shape whichever kind it is, and the identity of a
        // projected one is its (template, date) pair.
        ->and(collect($sessions)->pluck('templateId')->unique()->all())->toBe([(int) $template->id])
        ->and(collect($sessions)->every(fn (ProjectedSession $session): bool => count($session->teachers) === 2))
        ->toBeTrue();
});

test('a range wider than the ninety-two day limit is refused and the limit itself is not', function (): void {
    mondaySchedule($this->admin);
    $action = app(ListScheduleSessionsAction::class);
    $from = Carbon::today()->toDateString();

    $widest = $action->handle(from: $from, to: Carbon::today()->addDays(91)->toDateString());
    $tooWide = $action->handle(from: $from, to: Carbon::today()->addDays(92)->toDateString());

    expect($widest->isSuccess())->toBeTrue()
        ->and($tooWide->getError())->toBe(ScheduleError::DateRangeTooWide)
        ->and($tooWide->getMessage())->toBe('Khoảng ngày không được rộng hơn 92 ngày.');
});

test('a teacher sees only the lessons they are on, whichever role they hold', function (): void {
    [, $ownClass, $main, $assistant] = mondaySchedule($this->admin);
    [, $otherClass, $otherMain] = mondaySchedule($this->admin);
    $action = app(ListScheduleSessionsAction::class);
    $from = Carbon::today()->toDateString();
    $to = Carbon::parse(sessionMonday())->toDateString();

    $asMain = $action->handle(from: $from, to: $to, teacherProfileScope: (int) $main->profile_id)->getData();
    $asAssistant = $action->handle(from: $from, to: $to, teacherProfileScope: (int) $assistant->profile_id)->getData();
    $asAdmin = $action->handle(from: $from, to: $to)->getData();
    $prying = $action->handle(
        from: $from,
        to: $to,
        teacherProfileId: (int) $otherMain->profile_id,
        teacherProfileScope: (int) $main->profile_id,
    )->getData();

    expect(collect($asMain)->pluck('classId')->all())->toBe([(int) $ownClass->id])
        // An assistant is present at the lesson, so the lesson is theirs to see.
        ->and(collect($asAssistant)->pluck('classId')->all())->toBe([(int) $ownClass->id])
        ->and(collect($asAdmin)->pluck('classId')->sort()->values()->all())
        ->toBe(collect([(int) $ownClass->id, (int) $otherClass->id])->sort()->values()->all())
        // Asking after somebody else's calendar is answered with an empty one.
        ->and($prying)->toBe([]);
});

test('the room filter narrows the calendar to one room', function (): void {
    [$template, $class] = mondaySchedule($this->admin);
    mondaySchedule($this->admin);
    $action = app(ListScheduleSessionsAction::class);

    $inRoom = $action->handle(
        from: Carbon::today()->toDateString(),
        to: sessionMonday(),
        roomId: (int) $template->room_id,
    )->getData();

    expect(collect($inRoom)->pluck('classId')->all())->toBe([(int) $class->id]);
});

test('a written session is read back by identifier and an unknown identifier is not found', function (): void {
    [$template, $class, $main, $assistant] = mondaySchedule($this->admin);

    $written = app(ResolveScheduleSessionAction::class)
        ->handle((int) $template->id, sessionMonday(), (int) $this->admin->id)
        ->getData();

    $found = app(GetScheduleSessionAction::class)->handle((int) $written->id);
    $missing = app(GetScheduleSessionAction::class)->handle((int) $written->id + 1000);
    $outsideScope = app(GetScheduleSessionAction::class)->handle(
        (int) $written->id,
        (int) TeacherProfile::factory()->create()->profile_id,
    );
    $ownLesson = app(GetScheduleSessionAction::class)
        ->handle((int) $written->id, (int) $assistant->profile_id);

    expect((int) $found->getData()->class_id)->toBe((int) $class->id)
        ->and($found->getData()->teachers)->toHaveCount(2)
        ->and($missing->getError())->toBe(ScheduleError::SessionNotFound)
        ->and($missing->getMessage())->toBe('Không tìm thấy buổi học.')
        // A teacher who is not on the lesson is told it does not exist rather than that it
        // is not theirs, which would leak the lesson.
        ->and($outsideScope->getError())->toBe(ScheduleError::SessionNotFound)
        ->and($ownLesson->isSuccess())->toBeTrue()
        ->and((int) $ownLesson->getData()->id)->toBe((int) $written->id)
        ->and((int) $found->getData()->created_by)->toBe((int) $this->admin->id)
        ->and($main->profile_id)->not->toBeNull();
});

test('materialising a projected session copies the schedule unmoved, teachers included', function (): void {
    [$template, $class, $main, $assistant] = mondaySchedule($this->admin);
    $monday = sessionMonday();

    $written = app(ResolveScheduleSessionAction::class)
        ->handle((int) $template->id, $monday, (int) $this->admin->id)
        ->getData();

    expect((int) $written->template_id)->toBe((int) $template->id)
        ->and((int) $written->class_id)->toBe((int) $class->id)
        ->and((int) $written->subject_id)->toBe((int) $class->subject_id)
        ->and($written->date->toDateString())->toBe($monday)
        ->and((string) $written->start_time)->toBe('08:00:00')
        ->and((string) $written->end_time)->toBe('09:30:00')
        ->and((int) $written->room_id)->toBe((int) $template->room_id)
        ->and($written->schedule_type)->toBe(ScheduleType::Regular)
        ->and($written->status)->toBe(ScheduleStatus::Pending)
        ->and($written->is_customized)->toBeTrue()
        ->and((int) $written->created_by)->toBe((int) $this->admin->id)
        ->and($written->updated_by)->toBeNull();

    $this->assertDatabaseHas('schedule_instance_teachers', [
        'schedule_instance_id' => $written->id,
        'teacher_profile_id' => $main->profile_id,
        'role' => ScheduleTeacherRole::MainTeacher->value,
        'replaces_profile_id' => null,
    ]);

    // The assistant is copied as well, and copying a schedule is not a substitution.
    $this->assertDatabaseHas('schedule_instance_teachers', [
        'schedule_instance_id' => $written->id,
        'teacher_profile_id' => $assistant->profile_id,
        'role' => ScheduleTeacherRole::Assistant->value,
        'replaces_profile_id' => null,
    ]);
});

test('materialising the same lesson twice returns the same row and writes no second one', function (): void {
    [$template] = mondaySchedule($this->admin);
    $monday = sessionMonday();
    $action = app(ResolveScheduleSessionAction::class);

    $first = $action->handle((int) $template->id, $monday, (int) $this->admin->id);
    $second = $action->handle((int) $template->id, $monday, (int) $this->admin->id);

    expect($first->isSuccess())->toBeTrue()
        ->and($second->isSuccess())->toBeTrue()
        ->and((int) $second->getData()->id)->toBe((int) $first->getData()->id);

    $this->assertDatabaseCount('schedule_instances', 1);
    $this->assertDatabaseCount('schedule_instance_teachers', 2);
});

test('the session row and its teacher rows are written in one transaction', function (): void {
    [$template] = mondaySchedule($this->admin);
    $steps = [];

    Event::listen(TransactionBeginning::class, function () use (&$steps): void {
        $steps[] = 'begin';
    });
    Event::listen(TransactionCommitted::class, function () use (&$steps): void {
        $steps[] = 'commit';
    });
    DB::listen(function ($query) use (&$steps): void {
        if (str_starts_with($query->sql, 'insert into "schedule_instances"')) {
            $steps[] = 'session';
        }

        if (str_starts_with($query->sql, 'insert into "schedule_instance_teachers"')) {
            $steps[] = 'teachers';
        }
    });

    app(ResolveScheduleSessionAction::class)
        ->handle((int) $template->id, sessionMonday(), (int) $this->admin->id);

    $sessionAt = array_search('session', $steps, true);
    $lastTeacherAt = array_keys($steps, 'teachers', true)[count(array_keys($steps, 'teachers', true)) - 1];
    $between = array_slice($steps, $sessionAt, $lastTeacherAt - $sessionAt + 1);
    $after = array_slice($steps, $lastTeacherAt + 1);

    // A transaction is open before the session row is written, nothing is committed while
    // the session exists without its teachers, and the commit comes after both.
    expect(array_slice($steps, 0, $sessionAt))->toContain('begin')
        ->and($between)->not->toContain('commit')
        ->and($after)->toContain('commit');
});

test('a date no fixed schedule projects onto cannot be materialised', function (): void {
    [$template, $class] = mondaySchedule($this->admin);
    $action = app(ResolveScheduleSessionAction::class);
    $actor = (int) $this->admin->id;

    $tuesday = $action->handle(
        (int) $template->id,
        Carbon::parse(sessionMonday())->addDay()->toDateString(),
        $actor,
    );

    $beforeItApplies = $action->handle(
        (int) $template->id,
        Carbon::parse(sessionMonday())->subWeeks(3)->toDateString(),
        $actor,
    );

    $class->update(['end_at' => Carbon::parse(sessionMonday())->subDay()->toDateString()]);
    $afterTheClassEnds = $action->handle((int) $template->id, sessionMonday(), $actor);

    $unknownSchedule = $action->handle((int) $template->id + 1000, sessionMonday(), $actor);

    expect($tuesday->getError())->toBe(ScheduleError::VirtualSessionNotProjected)
        ->and($tuesday->getMessage())->toContain('không có buổi học nào vào ngày')
        ->and($beforeItApplies->getError())->toBe(ScheduleError::VirtualSessionNotProjected)
        ->and($afterTheClassEnds->getError())->toBe(ScheduleError::VirtualSessionNotProjected)
        ->and($unknownSchedule->getError())->toBe(ScheduleError::ScheduleTemplateNotFound);

    $this->assertDatabaseCount('schedule_instances', 0);
});

test('a fixed schedule with nobody leading it cannot be materialised', function (): void {
    $class = SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]);
    $template = ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '08:00:00',
        'end_time' => '09:30:00',
        'start_date' => now()->toDateString(),
    ]);

    $result = app(ResolveScheduleSessionAction::class)
        ->handle((int) $template->id, sessionMonday(), (int) $this->admin->id);

    expect($result->getError())->toBe(ScheduleError::MainTeacherRequired);

    // The refusal happens before anything is written, so no teacherless session exists.
    $this->assertDatabaseCount('schedule_instances', 0);
});
