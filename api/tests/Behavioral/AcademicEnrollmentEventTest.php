<?php

use App\Modules\Academic\Actions\EnrollStudentsAction;
use App\Modules\Academic\Actions\TransferEnrollmentAction;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\Subject;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

test('history returns events and legacy periods only for the requested class with pagination', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'start_at' => '2026-01-01',
    ]);
    $otherClass = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $legacy = ClassEnrollment::factory()->left()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
        'enrolled_at' => '2026-07-01',
        'left_at' => '2026-08-01',
        'note' => '[Chuyển sang lớp: KHONG-PARSE]',
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $otherClass->id,
        'student_id' => $student->profile_id,
    ]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => '2026-08-01',
    ])->assertCreated();

    $firstPage = $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$class->id}&per_page=1&page=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('data.0.kind', 'event')
        ->assertJsonPath('data.0.event_type', 0)
        ->assertJsonPath('data.0.enrollment.class.id', $class->id)
        ->assertJsonPath('data.0.actor.id', $this->admin->id);
    $secondPage = $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$class->id}&per_page=1&page=2")
        ->assertOk()
        ->assertJsonPath('data.0.kind', 'legacy_enrollment')
        ->assertJsonPath('data.0.enrollment.id', $legacy->id)
        ->assertJsonPath('data.0.enrollment.note', '[Chuyển sang lớp: KHONG-PARSE]')
        ->assertJsonPath('data.0.actor', null);

    expect($firstPage->json('data.0.enrollment.class.subjects'))->not->toBeEmpty()
        ->and($secondPage->json('data.0'))->not->toHaveKey('event_type')
        ->and($secondPage->json('data.0'))->not->toHaveKey('related_enrollment');
});

test('history requires a real class association and validates its query contract', function () {
    $student = StudentProfile::factory()->create();
    $class = SchoolClass::factory()->create();

    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('class_id');
    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$class->id}&sort=note")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('sort');
    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id=999999")
        ->assertNotFound();
    $this->getJson('/api/v1/academic/students/999999/enrollment-events?class_id=1')
        ->assertNotFound();
});

test('enrollment history rejects a page size above one hundred', function () {
    $student = StudentProfile::factory()->create();
    $class = SchoolClass::factory()->create();
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
    ]);

    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$class->id}&per_page=101")
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('per_page');
});

test('student class list returns distinct active and historical classes', function () {
    $student = StudentProfile::factory()->create();
    $activeClass = SchoolClass::factory()->create();
    $pastClass = SchoolClass::factory()->ended()->create();
    ClassEnrollment::factory()->create(['class_id' => $activeClass->id, 'student_id' => $student->profile_id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $activeClass->id, 'student_id' => $student->profile_id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $pastClass->id, 'student_id' => $student->profile_id]);

    $response = $this->getJson("/api/v1/academic/students/{$student->profile_id}/classes?per_page=1&page=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 2);
    $second = $this->getJson("/api/v1/academic/students/{$student->profile_id}/classes?per_page=1&page=2")
        ->assertOk();

    expect($response->json('data.0'))->toHaveKey('subjects')
        ->and(collect([...$response->json('data'), ...$second->json('data')])->pluck('id')->unique())->toHaveCount(2);
});

test('transfer options are searchable, paginated, and explain disabled candidates', function () {
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $eligible = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'code' => 'ELIGIBLE-9A',
    ]);
    $wrongGradeClass = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade8,
        'code' => 'WRONG-GRADE',
    ]);
    $duplicateClass = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'code' => 'ALREADY-ENROLLED',
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $duplicateClass->id,
        'student_id' => $student->profile_id,
    ]);
    $extraSubjectClass = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'code' => 'EXTRA-SUBJECT',
    ]);
    $extraSubjectClass->subjects()->attach(Subject::factory()->create()->id, ['is_primary' => false]);
    $fullClass = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 1,
        'code' => 'FULL-CLASS',
    ]);
    ClassEnrollment::factory()->create(['class_id' => $fullClass->id]);
    $endedClass = SchoolClass::factory()->ended()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'code' => 'ENDED-CLASS',
    ]);

    $response = $this->getJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer-options?q=ELIGIBLE&per_page=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $eligible->id)
        ->assertJsonPath('data.0.subjects.0.id', $source->subject_id)
        ->assertJsonPath('data.0.current_student_count', 0);

    $allOptions = collect($this->getJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer-options?per_page=50")
        ->assertOk()
        ->json('data'))
        ->keyBy('id');

    expect($response->json('data.0.assistant_teachers'))->toBeArray()
        ->and($response->json('data.0.is_eligible'))->toBeTrue()
        ->and($response->json('data.0.disabled_reason'))->toBeNull()
        ->and($allOptions->keys()->map(fn ($id): int => (int) $id)->all())->toContain(
            $eligible->id,
            $wrongGradeClass->id,
            $duplicateClass->id,
            $extraSubjectClass->id,
            $fullClass->id,
            $endedClass->id,
        )
        ->and($allOptions->get($wrongGradeClass->id)['disabled_reason'])->toBe('grade_mismatch')
        ->and($allOptions->get($duplicateClass->id)['disabled_reason'])->toBe('already_enrolled')
        ->and($allOptions->get($extraSubjectClass->id)['disabled_reason'])->toBe('subject_mismatch')
        ->and($allOptions->get($fullClass->id)['disabled_reason'])->toBe('class_full')
        ->and($allOptions->get($endedClass->id)['disabled_reason'])->toBe('class_ended')
        ->and($allOptions->has($source->id))->toBeFalse();
});

test('the event table uses typed fields, required indexes, and restrictive references', function () {
    $columns = DB::table('information_schema.columns')
        ->where('table_schema', 'public')
        ->where('table_name', 'class_enrollment_events')
        ->pluck('udt_name', 'column_name');
    $indexes = DB::table('pg_indexes')
        ->where('schemaname', 'public')
        ->where('tablename', 'class_enrollment_events')
        ->pluck('indexname');
    $restrictiveForeignKeys = DB::selectOne(<<<'SQL'
        SELECT COUNT(*) AS count
        FROM pg_constraint
        WHERE conrelid = 'class_enrollment_events'::regclass
          AND contype = 'f'
          AND confdeltype = 'r'
    SQL);

    expect($columns->get('event_type'))->toBe('int2')
        ->and($columns->get('effective_on'))->toBe('date')
        ->and($columns->get('note'))->toBe('text')
        ->and($columns->get('metadata'))->toBe('jsonb')
        ->and($columns->get('created_at'))->toBe('timestamptz')
        ->and($columns->get('updated_at'))->toBe('timestamptz')
        ->and($indexes)->toContain(
            'class_enrollment_events_class_enrollment_id_index',
            'class_enrollment_events_related_enrollment_id_index',
            'class_enrollment_events_class_enrollment_id_created_at_index',
            'class_enrollment_events_event_type_index',
        )
        ->and((int) $restrictiveForeignKeys->count)->toBe(3);
});

test('periods created before event recording have no synthetic history row', function () {
    $enrollment = ClassEnrollment::factory()->create();

    expect(DB::table('class_enrollment_events')->where('class_enrollment_id', $enrollment->id)->exists())
        ->toBeFalse();
});

test('enrolling students appends an actor-attributed event in the same transaction', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => '2026-09-23',
        'note' => 'Ghi chú ban đầu',
    ])->assertCreated();

    $event = DB::table('class_enrollment_events')->first();

    expect($event)->not->toBeNull()
        ->and((int) $event->event_type)->toBe(0)
        ->and((int) $event->actor_id)->toBe((int) $this->admin->id)
        ->and($event->effective_on)->toBe('2026-09-23')
        ->and($event->note)->toBe('Ghi chú ban đầu')
        ->and(json_decode($event->metadata, true))->toBe([]);
});

test('system-created enrollment events allow a null actor', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    app(EnrollStudentsAction::class)->handle(
        classId: (int) $class->id,
        studentIds: [(int) $student->profile_id],
        enrolledAt: now()->toDateString(),
    );

    expect(DB::table('class_enrollment_events')->value('actor_id'))->toBeNull();
});

test('editing a period appends before-and-after snapshots', function () {
    $class = SchoolClass::factory()->create(['start_at' => '2026-01-01']);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'enrolled_at' => '2026-08-01',
        'left_at' => null,
        'note' => 'Ghi chú cũ',
    ]);

    $this->putJson("/api/v1/academic/enrollments/{$enrollment->id}", [
        'enrolled_at' => '2026-08-02',
        'left_at' => '2026-09-01',
        'note' => 'Ghi chú mới',
    ])->assertOk();

    $event = DB::table('class_enrollment_events')->first();
    $metadata = json_decode($event->metadata, true);

    expect((int) $event->event_type)->toBe(1)
        ->and((int) $event->actor_id)->toBe((int) $this->admin->id)
        ->and($event->note)->toBe('Cập nhật thông tin ghi danh.')
        ->and($metadata)->toHaveKeys(['before', 'after'])
        ->and($metadata['before'])->toMatchArray([
            'enrolled_at' => '2026-08-01',
            'left_at' => null,
            'note' => 'Ghi chú cũ',
        ])
        ->and($metadata['after'])->toMatchArray([
            'enrolled_at' => '2026-08-02',
            'left_at' => '2026-09-01',
            'note' => 'Ghi chú mới',
        ]);
});

test('leaving a class records the supplied reason as an event', function () {
    $enrollment = ClassEnrollment::factory()->create();

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/leave", [
        'left_at' => now()->toDateString(),
        'reason' => 'Chuyển trường',
    ])->assertOk();

    $event = DB::table('class_enrollment_events')->first();

    expect((int) $event->event_type)->toBe(2)
        ->and((int) $event->class_enrollment_id)->toBe((int) $enrollment->id)
        ->and((int) $event->actor_id)->toBe((int) $this->admin->id)
        ->and($event->effective_on)->toBe(now()->toDateString())
        ->and($event->note)->toBe('Chuyển trường');
});

test('transferring a student appends reciprocal events for both periods', function () {
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $target = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
    ]);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $target->id,
        'left_at' => '2026-09-23',
        'note' => 'Đề nghị chuyển',
    ])->assertCreated();

    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$source->id}")
        ->assertOk()
        ->assertJsonPath('data.0.event_type', 3)
        ->assertJsonPath('data.0.related_enrollment.class.id', $target->id);
    $this->getJson("/api/v1/academic/students/{$student->profile_id}/enrollment-events?class_id={$target->id}")
        ->assertOk()
        ->assertJsonPath('data.0.event_type', 4)
        ->assertJsonPath('data.0.related_enrollment.class.id', $source->id);

    $events = DB::table('class_enrollment_events')->orderBy('event_type')->get()->keyBy('event_type');
    $sourceEvent = $events->get(3);
    $targetEvent = $events->get(4);

    expect($events)->toHaveCount(2)
        ->and((int) $sourceEvent->class_enrollment_id)->toBe((int) $enrollment->id)
        ->and((int) $sourceEvent->related_enrollment_id)->toBe((int) $targetEvent->class_enrollment_id)
        ->and((int) $targetEvent->related_enrollment_id)->toBe((int) $enrollment->id)
        ->and((int) $sourceEvent->actor_id)->toBe((int) $this->admin->id)
        ->and((int) $targetEvent->actor_id)->toBe((int) $this->admin->id)
        ->and($sourceEvent->effective_on)->toBe('2026-09-23')
        ->and($targetEvent->effective_on)->toBe('2026-09-23')
        ->and($sourceEvent->note)->toBe("Chuyển sang lớp: {$target->code}.")
        ->and($targetEvent->note)->toBe('Đề nghị chuyển');
});

test('event rows cannot be updated or deleted and protect their enrollment period', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])->assertCreated();

    $event = DB::table('class_enrollment_events')->first();
    $enrollmentId = (int) $event->class_enrollment_id;

    expect(fn () => DB::transaction(
        fn () => DB::table('class_enrollment_events')->where('id', $event->id)->update(['note' => 'sửa']),
    ))->toThrow(QueryException::class)
        ->and(fn () => DB::transaction(
            fn () => DB::table('class_enrollment_events')->where('id', $event->id)->delete(),
        ))->toThrow(QueryException::class)
        ->and(fn () => DB::transaction(
            fn () => ClassEnrollment::query()->whereKey($enrollmentId)->delete(),
        ))->toThrow(QueryException::class);
});

test('a failed event insert rolls back the enrollment batch', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    expect(fn () => app(EnrollStudentsAction::class)->handle(
        classId: (int) $class->id,
        studentIds: [(int) $student->profile_id],
        enrolledAt: now()->toDateString(),
        actorId: 999999,
    ))->toThrow(QueryException::class);

    $this->assertDatabaseCount('class_enrollments', 0);
    $this->assertDatabaseCount('class_enrollment_events', 0);
});

test('a failed transfer event insert rolls back both periods and both events', function () {
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $target = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
    ]);

    expect(fn () => app(TransferEnrollmentAction::class)->handle(
        enrollmentId: (int) $enrollment->id,
        targetClassId: (int) $target->id,
        leftAt: now()->toDateString(),
        actorId: 999999,
    ))->toThrow(QueryException::class);

    expect($enrollment->fresh()->left_at)->toBeNull()
        ->and(ClassEnrollment::query()->where('class_id', $target->id)->exists())->toBeFalse();
    $this->assertDatabaseCount('class_enrollment_events', 0);
});

test('finishing a class appends an event for each period it closes', function () {
    $class = SchoolClass::factory()->create();
    $enrollment = ClassEnrollment::factory()->create(['class_id' => $class->id]);
    ClassEnrollment::factory()->create(['class_id' => $class->id]);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => 1])->assertOk();

    $events = DB::table('class_enrollment_events')->orderBy('class_enrollment_id')->get();

    expect($events)->toHaveCount(2)
        ->and((int) $events[0]->event_type)->toBe(5)
        ->and((int) $events[0]->class_enrollment_id)->toBe((int) $enrollment->id)
        ->and((int) $events[0]->actor_id)->toBe((int) $this->admin->id)
        ->and($events[0]->note)->toBe('Lớp đã kết thúc.')
        ->and((int) $events[1]->event_type)->toBe(5);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => 0])->assertOk();
    $this->assertDatabaseCount('class_enrollment_events', 2);
});
