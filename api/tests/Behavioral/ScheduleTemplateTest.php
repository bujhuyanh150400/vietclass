<?php

use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Actions\CloseScheduleTemplateAction;
use App\Modules\Schedule\Actions\CreateScheduleTemplateAction;
use App\Modules\Schedule\Actions\DeleteScheduleTemplateAction;
use App\Modules\Schedule\Actions\ListScheduleTemplatesAction;
use App\Modules\Schedule\Actions\ReviseScheduleTemplateAction;
use App\Modules\Schedule\Actions\SetScheduleTemplateTeachersAction;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Models\ScheduleTemplateTeacher;
use Illuminate\Database\QueryException;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function templateActor(): int
{
    return (int) User::factory()->create()->id;
}

/**
 * @return array{0: SchoolClass, 1: Room, 2: TeacherProfile}
 */
function templateContext(): array
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
function templateSlot(Room $room, array $overrides = []): array
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
function templateRoster(TeacherProfile ...$teachers): array
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

test('a schedule is created with a main teacher and an assistant', function (): void {
    [$class, $room, $main] = templateContext();
    $assistant = TeacherProfile::factory()->create();
    $actor = templateActor();

    $result = app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        templateSlot($room),
        templateRoster($main, $assistant),
        $actor,
    );

    expect($result->isSuccess())->toBeTrue();

    $template = $result->getData();

    expect($template->teachers)->toHaveCount(2)
        ->and($template->mainTeacher->teacher_profile_id)->toBe($main->profile_id)
        ->and((string) $template->start_time)->toBe('08:00:00');

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $template->id,
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'created_by' => $actor,
        'updated_by' => null,
        'end_date' => null,
    ]);
});

test('a schedule without a main teacher, with two, or with a repeat is refused', function (): void {
    [$class, $room, $main] = templateContext();
    $second = TeacherProfile::factory()->create();
    $actor = templateActor();
    $action = app(CreateScheduleTemplateAction::class);

    $noMain = $action->handle((int) $class->id, templateSlot($room), [
        ['teacher_profile_id' => $main->profile_id, 'role' => ScheduleTeacherRole::Assistant->value],
    ], $actor);

    $twoMains = $action->handle((int) $class->id, templateSlot($room), [
        ['teacher_profile_id' => $main->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
        ['teacher_profile_id' => $second->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
    ], $actor);

    $repeated = $action->handle((int) $class->id, templateSlot($room), [
        ['teacher_profile_id' => $main->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
        ['teacher_profile_id' => $main->profile_id, 'role' => ScheduleTeacherRole::Assistant->value],
    ], $actor);

    expect($noMain->getError())->toBe(ScheduleError::MainTeacherRequired)
        ->and($twoMains->getError())->toBe(ScheduleError::MultipleMainTeachers)
        ->and($repeated->getError())->toBe(ScheduleError::DuplicateTeacher);

    $this->assertDatabaseCount('schedule_templates', 0);
});

test('the database refuses a second main teacher even when no Action is involved', function (): void {
    $template = ScheduleTemplate::factory()->create();

    ScheduleTemplateTeacher::factory()->create(['schedule_template_id' => $template->id]);

    expect(fn (): ScheduleTemplateTeacher => ScheduleTemplateTeacher::factory()->create([
        'schedule_template_id' => $template->id,
    ]))->toThrow(QueryException::class);
});

test('the database refuses the same teacher twice on one schedule', function (): void {
    $template = ScheduleTemplate::factory()->create();
    $teacher = TeacherProfile::factory()->create();

    ScheduleTemplateTeacher::factory()->create([
        'schedule_template_id' => $template->id,
        'teacher_profile_id' => $teacher->profile_id,
    ]);

    expect(fn (): ScheduleTemplateTeacher => ScheduleTemplateTeacher::factory()->assistant()->create([
        'schedule_template_id' => $template->id,
        'teacher_profile_id' => $teacher->profile_id,
    ]))->toThrow(QueryException::class);
});

test('a finished class, a locked room, and a departed assistant are each refused', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();
    $action = app(CreateScheduleTemplateAction::class);

    $endedClass = SchoolClass::factory()->create(['status' => ClassStatus::Ended]);
    $lockedRoom = Room::factory()->create(['status' => RoomStatus::Maintenance]);
    $departed = TeacherProfile::factory()->create(['status' => TeacherStatus::Inactive]);

    expect($action->handle((int) $endedClass->id, templateSlot($room), templateRoster($main), $actor)->getError())
        ->toBe(AcademicError::ClassNotActive)
        ->and($action->handle((int) $class->id, templateSlot($lockedRoom), templateRoster($main), $actor)->getError())
        ->toBe(AcademicError::RoomInactive)
        ->and($action->handle((int) $class->id, templateSlot($room), templateRoster($main, $departed), $actor)->getError())
        ->toBe(AcademicError::TeacherInactive);
});

test('a schedule starting before the class opens is refused', function (): void {
    [$class, $room, $main] = templateContext();

    $result = app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        templateSlot($room, ['start_date' => now()->subMonths(2)->toDateString()]),
        templateRoster($main),
        templateActor(),
    );

    expect($result->getError())->toBe(ScheduleError::StartDateBeforeClassStart);
});

test('a schedule outliving the class is refused', function (): void {
    $class = SchoolClass::factory()->create([
        'start_at' => now()->subMonth()->toDateString(),
        'end_at' => now()->addMonth()->toDateString(),
    ]);
    $room = Room::factory()->create();
    $main = TeacherProfile::factory()->create();

    $result = app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        templateSlot($room, ['end_date' => now()->addMonths(3)->toDateString()]),
        templateRoster($main),
        templateActor(),
    );

    expect($result->getError())->toBe(ScheduleError::EndDateAfterClassEnd);
});

test('replacing the teacher list keeps one main teacher and stamps the editor', function (): void {
    [$class, $room, $main] = templateContext();
    $replacement = TeacherProfile::factory()->create();
    $actor = templateActor();
    $editor = templateActor();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), $actor)
        ->getData();

    $result = app(SetScheduleTemplateTeachersAction::class)->handle(
        (int) $created->id,
        templateRoster($replacement, $main),
        $editor,
    );

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->teachers)->toHaveCount(2)
        ->and($result->getData()->mainTeacher->teacher_profile_id)->toBe($replacement->profile_id);

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $created->id,
        'updated_by' => $editor,
    ]);
    $this->assertDatabaseCount('schedule_template_teachers', 2);
});

test('replacing a teacher list with two main teachers is refused before any write', function (): void {
    [$class, $room, $main] = templateContext();
    $second = TeacherProfile::factory()->create();
    $actor = templateActor();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), $actor)
        ->getData();

    $result = app(SetScheduleTemplateTeachersAction::class)->handle((int) $created->id, [
        ['teacher_profile_id' => $main->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
        ['teacher_profile_id' => $second->profile_id, 'role' => ScheduleTeacherRole::MainTeacher->value],
    ], $actor);

    expect($result->getError())->toBe(ScheduleError::MultipleMainTeachers);

    $this->assertDatabaseCount('schedule_template_teachers', 1);
});

test('a revision closes the old row the day before and opens a new one', function (): void {
    [$class, $room, $main] = templateContext();
    $newRoom = Room::factory()->create();
    $actor = templateActor();
    $editor = templateActor();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room, [
            'start_date' => now()->subWeek()->toDateString(),
        ]), templateRoster($main), $actor)
        ->getData();

    $effectiveOn = now()->addWeek();

    $result = app(ReviseScheduleTemplateAction::class)->handle(
        (int) $created->id,
        $effectiveOn->toDateString(),
        [
            'room_id' => $newRoom->id,
            'day_of_week' => DayOfWeek::Wednesday->value,
            'start_time' => '13:00',
            'end_time' => '15:00',
        ],
        templateRoster($main),
        $editor,
    );

    expect($result->isSuccess())->toBeTrue()
        ->and((int) $result->getData()->id)->not->toBe((int) $created->id);

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $created->id,
        'end_date' => $effectiveOn->copy()->subDay()->toDateString(),
        'updated_by' => $editor,
    ]);
    $this->assertDatabaseHas('schedule_templates', [
        'id' => $result->getData()->id,
        'start_date' => $effectiveOn->toDateString(),
        'room_id' => $newRoom->id,
        'day_of_week' => DayOfWeek::Wednesday->value,
        'created_by' => $editor,
        'updated_by' => null,
    ]);
    $this->assertDatabaseCount('schedule_templates', 2);
});

test('a revision effective on the old start date replaces the row instead of leaving it', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();
    $startsOn = now()->addWeek()->toDateString();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room, ['start_date' => $startsOn]), templateRoster($main), $actor)
        ->getData();

    $result = app(ReviseScheduleTemplateAction::class)->handle(
        (int) $created->id,
        $startsOn,
        [
            'room_id' => $room->id,
            'day_of_week' => DayOfWeek::Monday->value,
            'start_time' => '10:00',
            'end_time' => '11:30',
        ],
        templateRoster($main),
        $actor,
    );

    expect($result->isSuccess())->toBeTrue();

    $this->assertDatabaseMissing('schedule_templates', ['id' => $created->id]);
    $this->assertDatabaseCount('schedule_templates', 1);
    $this->assertDatabaseCount('schedule_template_teachers', 1);
});

test('a revision effective in the past is refused', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), $actor)
        ->getData();

    $result = app(ReviseScheduleTemplateAction::class)->handle(
        (int) $created->id,
        now()->subDay()->toDateString(),
        [
            'room_id' => $room->id,
            'day_of_week' => DayOfWeek::Monday->value,
            'start_time' => '10:00',
            'end_time' => '11:30',
        ],
        templateRoster($main),
        $actor,
    );

    expect($result->getError())->toBe(ScheduleError::RevisionEffectiveDateInPast);

    $this->assertDatabaseCount('schedule_templates', 1);
});

test('closing a schedule sets the end date and stamps the editor', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();
    $editor = templateActor();
    $closeOn = now()->addWeek()->toDateString();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), $actor)
        ->getData();

    $result = app(CloseScheduleTemplateAction::class)->handle((int) $created->id, $closeOn, $editor);

    expect($result->isSuccess())->toBeTrue();

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $created->id,
        'end_date' => $closeOn,
        'updated_by' => $editor,
    ]);
});

test('closing a schedule before it started applying is refused', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();

    $created = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room, [
            'start_date' => now()->addWeek()->toDateString(),
        ]), templateRoster($main), $actor)
        ->getData();

    $result = app(CloseScheduleTemplateAction::class)
        ->handle((int) $created->id, now()->toDateString(), $actor);

    expect($result->getError())->toBe(ScheduleError::CloseDateBeforeStartDate);
});

test('only a schedule still in the future can be deleted', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();
    $action = app(CreateScheduleTemplateAction::class);

    $running = $action->handle((int) $class->id, templateSlot($room), templateRoster($main), $actor)->getData();
    $future = $action->handle((int) $class->id, templateSlot($room, [
        'day_of_week' => DayOfWeek::Friday->value,
        'start_date' => now()->addWeek()->toDateString(),
    ]), templateRoster($main), $actor)->getData();

    $refused = app(DeleteScheduleTemplateAction::class)->handle((int) $running->id);
    $allowed = app(DeleteScheduleTemplateAction::class)->handle((int) $future->id);

    expect($refused->getError())->toBe(ScheduleError::ScheduleTemplateAlreadyStarted)
        ->and($allowed->isSuccess())->toBeTrue();

    $this->assertDatabaseHas('schedule_templates', ['id' => $running->id]);
    $this->assertDatabaseMissing('schedule_templates', ['id' => $future->id]);
    $this->assertDatabaseCount('schedule_template_teachers', 1);
});

test('a future schedule a written session already points at cannot be deleted', function (): void {
    [$class, $room, $main] = templateContext();
    $actor = templateActor();
    $effectiveOn = now()->addWeek()->toDateString();

    $future = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room, ['start_date' => $effectiveOn]), templateRoster($main), $actor)
        ->getData();

    ScheduleInstance::factory()->create([
        'class_id' => $class->id,
        'template_id' => $future->id,
        'subject_id' => $class->subject_id,
        'date' => $effectiveOn,
        'room_id' => $room->id,
        'is_customized' => true,
    ]);

    $result = app(DeleteScheduleTemplateAction::class)->handle((int) $future->id);

    expect($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(ScheduleError::ScheduleTemplateHasSessions)
        ->and($result->getMessage())->toBe('Lịch cố định đã sinh 1 buổi học, không thể xóa.');

    $this->assertDatabaseHas('schedule_templates', ['id' => $future->id]);
});

test('every operation reports a missing schedule consistently', function (): void {
    $actor = templateActor();

    expect(app(CloseScheduleTemplateAction::class)->handle(9999, now()->toDateString(), $actor)->getError())
        ->toBe(ScheduleError::ScheduleTemplateNotFound)
        ->and(app(DeleteScheduleTemplateAction::class)->handle(9999)->getError())
        ->toBe(ScheduleError::ScheduleTemplateNotFound)
        ->and(app(SetScheduleTemplateTeachersAction::class)->handle(9999, [], $actor)->getError())
        ->toBe(ScheduleError::ScheduleTemplateNotFound);
});

test('the list returns closed schedules too, ordered by weekday and start time', function (): void {
    [$class, $room, $main] = templateContext();

    ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Wednesday,
        'start_time' => '07:00:00',
        'end_time' => '08:00:00',
        'end_date' => now()->subDay()->toDateString(),
    ]);
    ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '15:00:00',
        'end_time' => '16:00:00',
    ]);
    ScheduleTemplate::factory()->create([
        'class_id' => $class->id,
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '06:00:00',
        'end_time' => '07:00:00',
    ]);
    ScheduleTemplate::factory()->create();

    $result = app(ListScheduleTemplatesAction::class)->handle((int) $class->id);

    expect($result->isSuccess())->toBeTrue()
        ->and($result->getData()->pluck('start_time')->all())
        ->toBe(['06:00:00', '15:00:00', '07:00:00']);

    expect(app(ListScheduleTemplatesAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::ClassNotFound);

    $narrowed = app(ListScheduleTemplatesAction::class)
        ->handle((int) $class->id, (int) $main->profile_id);

    expect($narrowed->getData())->toHaveCount(0);
});

test('schedule endpoints create, list, restaff, revise, close, and delete a schedule', function (): void {
    [$class, $room, $main] = templateContext();
    $assistant = TeacherProfile::factory()->create();
    $newRoom = Room::factory()->create();

    $created = $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room),
        'teachers' => templateRoster($main, $assistant),
    ])
        ->assertCreated()
        ->assertJsonPath('data.day_of_week', DayOfWeek::Monday->value)
        ->assertJsonPath('data.day_of_week_label', 'Thứ 2')
        ->assertJsonPath('data.start_time', '08:00')
        ->assertJsonPath('data.end_time', '09:30')
        ->assertJsonPath('data.room_name', $room->name)
        ->assertJsonPath('data.is_closed', false)
        ->assertJsonPath('data.main_teacher.teacher_profile_id', $main->profile_id)
        ->assertJsonPath('data.main_teacher.role_label', 'Giáo viên chính')
        ->assertJsonCount(1, 'data.assistant_teachers')
        ->assertJsonPath('data.assistant_teachers.0.teacher_profile_id', $assistant->profile_id)
        ->assertJsonPath('data.assistant_teachers.0.role_label', 'Trợ giảng')
        ->assertJsonCount(2, 'data.teachers');

    $templateId = $created->json('data.id');

    $this->getJson("/api/v1/classes/{$class->id}/schedule-templates")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $templateId)
        ->assertJsonStructure([
            'data' => [[
                'id', 'class_id', 'day_of_week', 'day_of_week_label', 'start_time', 'end_time',
                'room_id', 'room_name', 'start_date', 'end_date', 'is_closed',
                'main_teacher', 'assistant_teachers', 'teachers', 'created_at', 'updated_at',
            ]],
        ]);

    $this->putJson("/api/v1/schedule-templates/{$templateId}/teachers", [
        'teachers' => templateRoster($assistant, $main),
    ])
        ->assertOk()
        ->assertJsonPath('data.main_teacher.teacher_profile_id', $assistant->profile_id);

    $effectiveOn = now()->addWeek()->toDateString();

    $revised = $this->putJson("/api/v1/schedule-templates/{$templateId}", [
        'effective_date' => $effectiveOn,
        'room_id' => $newRoom->id,
        'day_of_week' => DayOfWeek::Thursday->value,
        'start_time' => '13:00',
        'end_time' => '15:00',
        'teachers' => templateRoster($main),
    ])
        ->assertOk()
        ->assertJsonPath('data.day_of_week', DayOfWeek::Thursday->value)
        ->assertJsonPath('data.start_date', $effectiveOn)
        ->assertJsonPath('data.room_id', (int) $newRoom->id);

    $revisedId = $revised->json('data.id');

    expect($revisedId)->not->toBe($templateId);

    $closeOn = now()->addMonth()->toDateString();

    $this->patchJson("/api/v1/schedule-templates/{$revisedId}/close", ['end_date' => $closeOn])
        ->assertOk()
        ->assertJsonPath('data.end_date', $closeOn)
        ->assertJsonPath('data.is_closed', true);

    $this->deleteJson("/api/v1/schedule-templates/{$revisedId}")->assertNoContent();

    $this->assertDatabaseMissing('schedule_templates', ['id' => $revisedId]);
});

test('an end time at or before the start time is reported against the end time field', function (): void {
    [$class, $room, $main] = templateContext();

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room, ['start_time' => '09:30', 'end_time' => '08:00']),
        'teachers' => templateRoster($main),
    ])
        ->assertJsonValidationErrorFor('end_time')
        ->assertJsonPath('errors.end_time.0', 'Giờ kết thúc phải sau giờ bắt đầu.');

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room, ['start_time' => '08:00', 'end_time' => '08:00']),
        'teachers' => templateRoster($main),
    ])->assertJsonValidationErrorFor('end_time');

    $this->assertDatabaseCount('schedule_templates', 0);
});

test('an end date before the start date is reported against the end date field', function (): void {
    [$class, $room, $main] = templateContext();

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room, [
            'start_date' => now()->addWeek()->toDateString(),
            'end_date' => now()->toDateString(),
        ]),
        'teachers' => templateRoster($main),
    ])
        ->assertJsonValidationErrorFor('end_date')
        ->assertJsonPath('errors.end_date.0', 'Ngày kết thúc không được trước ngày bắt đầu.');

    $this->assertDatabaseCount('schedule_templates', 0);
});

test('the revision path enforces the same two order rules', function (): void {
    [$class, $room, $main] = templateContext();

    $template = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), (int) $this->admin->id)
        ->getData();

    $payload = [
        'effective_date' => now()->addWeek()->toDateString(),
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '13:00',
        'end_time' => '15:00',
        'teachers' => templateRoster($main),
    ];

    $this->putJson("/api/v1/schedule-templates/{$template->id}", [
        ...$payload,
        'end_time' => '13:00',
    ])
        ->assertJsonValidationErrorFor('end_time')
        ->assertJsonPath('errors.end_time.0', 'Giờ kết thúc phải sau giờ bắt đầu.');

    $this->putJson("/api/v1/schedule-templates/{$template->id}", [
        ...$payload,
        'end_date' => now()->toDateString(),
    ])
        ->assertJsonValidationErrorFor('end_date')
        ->assertJsonPath('errors.end_date.0', 'Ngày kết thúc không được trước ngày hiệu lực.');

    $this->assertDatabaseCount('schedule_templates', 1);
});

test('a malformed schedule payload is reported field by field', function (): void {
    [$class, $room, $main] = templateContext();

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room, ['day_of_week' => 9]),
        'teachers' => templateRoster($main),
    ])
        ->assertJsonValidationErrorFor('day_of_week')
        ->assertJsonPath('errors.day_of_week.0', 'Thứ trong tuần không hợp lệ.');

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room),
        'teachers' => [],
    ])
        ->assertJsonValidationErrorFor('teachers')
        ->assertJsonPath('errors.teachers.0', 'Lịch cố định phải có ít nhất một giáo viên.');

    $badRole = $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room),
        'teachers' => [['teacher_profile_id' => $main->profile_id, 'role' => 7]],
    ])->assertJsonValidationErrorFor('teachers.0.role');

    expect($badRole->json('errors')['teachers.0.role'][0])->toBe('Vai trò giáo viên không hợp lệ.');
});

test('a business failure reaches the caller with the status its declaration names', function (): void {
    [$class, $room, $main] = templateContext();
    $lockedRoom = Room::factory()->create(['status' => RoomStatus::Maintenance]);

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($lockedRoom),
        'teachers' => templateRoster($main),
    ])->assertStatus(422);

    $this->postJson('/api/v1/classes/9999/schedule-templates', [
        ...templateSlot($room),
        'teachers' => templateRoster($main),
    ])->assertNotFound();

    $this->patchJson('/api/v1/schedule-templates/9999/close', ['end_date' => now()->toDateString()])
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lịch cố định.');

    $running = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), (int) $this->admin->id)
        ->getData();

    $this->deleteJson("/api/v1/schedule-templates/{$running->id}")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Lịch cố định đã có hiệu lực, hãy đóng lịch thay vì xóa.');
});

test('a write path stamps the authenticated administrator as creator and editor', function (): void {
    [$class, $room, $main] = templateContext();

    $created = $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room),
        'teachers' => templateRoster($main),
    ])->assertCreated();

    $templateId = $created->json('data.id');

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $templateId,
        'created_by' => (int) $this->admin->id,
        'updated_by' => null,
    ]);

    $this->patchJson("/api/v1/schedule-templates/{$templateId}/close", [
        'end_date' => now()->addWeek()->toDateString(),
    ])->assertOk();

    $this->assertDatabaseHas('schedule_templates', [
        'id' => $templateId,
        'updated_by' => (int) $this->admin->id,
    ]);
});

test('a teacher reads only the schedules they are on and cannot write any', function (): void {
    [$class, $room, $main] = templateContext();
    $stranger = TeacherProfile::factory()->create();

    $mine = app(CreateScheduleTemplateAction::class)
        ->handle((int) $class->id, templateSlot($room), templateRoster($main), (int) $this->admin->id)
        ->getData();

    app(CreateScheduleTemplateAction::class)->handle(
        (int) $class->id,
        templateSlot($room, ['day_of_week' => DayOfWeek::Friday->value]),
        templateRoster($stranger),
        (int) $this->admin->id,
    );

    $this->withToken($main->profile->user->createToken('test')->plainTextToken);

    $this->getJson("/api/v1/classes/{$class->id}/schedule-templates")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', (int) $mine->id);

    $this->postJson("/api/v1/classes/{$class->id}/schedule-templates", [
        ...templateSlot($room, ['day_of_week' => DayOfWeek::Saturday->value]),
        'teachers' => templateRoster($main),
    ])->assertForbidden();

    $this->putJson("/api/v1/schedule-templates/{$mine->id}", [
        'effective_date' => now()->addWeek()->toDateString(),
        'room_id' => $room->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '13:00',
        'end_time' => '15:00',
        'teachers' => templateRoster($main),
    ])->assertForbidden();

    $this->putJson("/api/v1/schedule-templates/{$mine->id}/teachers", [
        'teachers' => templateRoster($main),
    ])->assertForbidden();

    $this->patchJson("/api/v1/schedule-templates/{$mine->id}/close", [
        'end_date' => now()->addWeek()->toDateString(),
    ])->assertForbidden();

    $this->deleteJson("/api/v1/schedule-templates/{$mine->id}")->assertForbidden();
});

test('an unauthenticated caller reaches no schedule endpoint', function (): void {
    $template = ScheduleTemplate::factory()->create();

    $this->withToken('')
        ->getJson("/api/v1/classes/{$template->class_id}/schedule-templates")
        ->assertUnauthorized();
});
