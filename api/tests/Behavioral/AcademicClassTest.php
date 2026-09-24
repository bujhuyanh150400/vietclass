<?php

use App\Modules\Academic\Actions\ChangeClassStatusAction;
use App\Modules\Academic\Actions\GetClassAction;
use App\Modules\Academic\Actions\UpdateClassAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use Illuminate\Validation\ValidationException;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function classPayload(array $overrides = []): array
{
    return [
        'code' => 'TOAN-9A',
        'name' => 'Toán 9A',
        'subject_id' => Subject::factory()->create()->id,
        'teacher_id' => TeacherProfile::factory()->create()->profile_id,
        'grade_level' => GradeLevel::Grade9->value,
        'max_students' => 20,
        'start_at' => now()->toDateString(),
        ...$overrides,
    ];
}

test('a class is created in the running state', function () {
    $this->postJson('/api/v1/academic/classes', classPayload())
        ->assertCreated()
        ->assertJsonPath('data.code', 'TOAN-9A')
        ->assertJsonPath('data.status', ClassStatus::Active->value)
        ->assertJsonPath('data.active_students_count', 0);
});

test('class list search matches a numeric class id exactly', function () {
    $class = SchoolClass::factory()->create([
        'code' => 'IDSEARCHALPHA',
        'name' => 'Alpha class',
    ]);

    $this->getJson('/api/v1/academic/classes?q='.$class->id)
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $class->id);
});

test('a class grade cannot change away from an actively enrolled student grade', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create([
        'grade_level' => GradeLevel::Grade9,
    ]);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
    ]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => GradeLevel::Grade8->value,
        'max_students' => $class->max_students,
    ])->assertUnprocessable()->assertJsonValidationErrorFor('grade_level');

    expect($class->fresh()->grade_level)->toBe(GradeLevel::Grade9);
});

test('a class keeps its representative subject and exposes every subject and assistant', function () {
    $primary = Subject::factory()->create();
    $extra = Subject::factory()->create();
    $lead = TeacherProfile::factory()->create();
    $assistant = TeacherProfile::factory()->create();

    $response = $this->postJson('/api/v1/academic/classes', classPayload([
        'subject_id' => $primary->id,
        'subject_ids' => [$primary->id, $extra->id],
        'teacher_id' => $lead->profile_id,
        'assistant_teacher_ids' => [$assistant->profile_id],
    ]))->assertCreated()
        ->assertJsonPath('data.subject_id', $primary->id)
        ->assertJsonCount(2, 'data.subjects')
        ->assertJsonPath('data.subjects.0.is_active', true)
        ->assertJsonPath('data.subjects.0.grade_levels', GradeLevel::values())
        ->assertJsonPath('data.subjects.0.is_primary', true)
        ->assertJsonPath('data.teacher_id', $lead->profile_id)
        ->assertJsonPath('data.teacher_name', $lead->profile->full_name)
        ->assertJsonPath('data.teacher_status', 0)
        ->assertJsonPath('data.assistant_teachers.0.id', $assistant->profile_id)
        ->assertJsonPath('data.assistant_teachers.0.status', 0);

    $classId = $response->json('data.id');
    $this->assertDatabaseHas('class_subjects', ['class_id' => $classId, 'subject_id' => $primary->id, 'is_primary' => true]);
    $this->assertDatabaseHas('class_subjects', ['class_id' => $classId, 'subject_id' => $extra->id, 'is_primary' => false]);
    $this->assertDatabaseHas('class_teachers', ['class_id' => $classId, 'teacher_id' => $lead->profile_id, 'is_primary' => true]);
    $this->assertDatabaseHas('class_teachers', ['class_id' => $classId, 'teacher_id' => $assistant->profile_id, 'is_primary' => false]);
});

test('class detail reports current students and historical enrollment periods separately', function () {
    $class = SchoolClass::factory()->create();
    ClassEnrollment::factory()->create(['class_id' => $class->id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);

    $this->getJson("/api/v1/academic/classes/{$class->id}")
        ->assertOk()
        ->assertJsonPath('data.active_students_count', 1)
        ->assertJsonPath('data.past_enrollments_count', 1);
});

test('legacy class creation exposes a one-subject team to old clients', function () {
    $payload = classPayload();

    $this->postJson('/api/v1/academic/classes', $payload)
        ->assertCreated()
        ->assertJsonPath('data.subject_id', $payload['subject_id'])
        ->assertJsonCount(1, 'data.subjects')
        ->assertJsonCount(0, 'data.assistant_teachers');
});

test('factory classes have normalized primary subject and teacher rows without model events', function () {
    $class = SchoolClass::withoutEvents(fn (): SchoolClass => SchoolClass::factory()->create());

    $this->assertDatabaseHas('class_subjects', [
        'class_id' => $class->id,
        'subject_id' => $class->subject_id,
        'is_primary' => true,
    ]);
    $this->assertDatabaseHas('class_teachers', [
        'class_id' => $class->id,
        'teacher_id' => $class->teacher_id,
        'is_primary' => true,
    ]);
});

test('class creation rejects duplicate relationship ids and a lead repeated as an assistant', function () {
    $payload = classPayload();
    $assistant = TeacherProfile::factory()->create();

    $this->postJson('/api/v1/academic/classes', [...$payload, 'subject_ids' => [$payload['subject_id'], $payload['subject_id']]])
        ->assertJsonValidationErrorFor('subject_ids.1');

    $this->postJson('/api/v1/academic/classes', [...$payload, 'assistant_teacher_ids' => [$assistant->profile_id, $assistant->profile_id]])
        ->assertJsonValidationErrorFor('assistant_teacher_ids.1');

    $this->postJson('/api/v1/academic/classes', [...$payload, 'assistant_teacher_ids' => [$payload['teacher_id']]])
        ->assertJsonValidationErrorFor('assistant_teacher_ids');

    $otherSubject = Subject::factory()->create();
    $this->postJson('/api/v1/academic/classes', [...$payload, 'subject_ids' => [$otherSubject->id]])
        ->assertJsonValidationErrorFor('subject_ids');

    $this->assertDatabaseCount('classes', 0);
});

test('every additional subject selected for a class must be active and support its grade', function () {
    $primary = Subject::factory()->create();
    $inactive = Subject::factory()->inactive()->create();
    $wrongGrade = Subject::factory()->create(['grade_levels' => [GradeLevel::Grade1->value]]);

    $this->postJson('/api/v1/academic/classes', classPayload([
        'subject_id' => $primary->id,
        'subject_ids' => [$primary->id, $inactive->id],
    ]))->assertStatus(422);

    $this->postJson('/api/v1/academic/classes', classPayload([
        'subject_id' => $primary->id,
        'subject_ids' => [$primary->id, $wrongGrade->id],
    ]))->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này không áp dụng cho khối 9.');

    $this->assertDatabaseCount('classes', 0);
});

test('an assistant selected for a class must still be employed', function () {
    $inactive = TeacherProfile::factory()->inactive()->create();

    $this->postJson('/api/v1/academic/classes', classPayload([
        'assistant_teacher_ids' => [$inactive->profile_id],
    ]))->assertStatus(422)
        ->assertJsonPath('message', 'Trợ giảng này không còn làm việc hoặc không tồn tại.');

    $this->assertDatabaseCount('classes', 0);
});

test('a legacy class update preserves additional subjects and assistants', function () {
    $class = SchoolClass::factory()->create();
    $originalPrimary = $class->subject_id;
    $extra = Subject::factory()->create();
    $nextPrimary = Subject::factory()->create();
    $assistant = TeacherProfile::factory()->create();
    $class->subjects()->attach($extra->id);
    $class->assistantTeachers()->attach($assistant->profile_id);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $nextPrimary->id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertOk()
        ->assertJsonPath('data.subject_id', $nextPrimary->id)
        ->assertJsonCount(2, 'data.subjects')
        ->assertJsonCount(1, 'data.assistant_teachers');

    expect($class->fresh()->subjects()->pluck('subjects.id')->all())->toContain($extra->id, $nextPrimary->id)
        ->not->toContain($originalPrimary);
});

test('a legacy class update rejects promoting a preserved assistant to lead', function () {
    $class = SchoolClass::factory()->create();
    $oldLeadId = $class->teacher_id;
    $newLead = TeacherProfile::factory()->create();
    $class->assistantTeachers()->attach($newLead->profile_id);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $newLead->profile_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertUnprocessable()
        ->assertJsonValidationErrorFor('teacher_id')
        ->assertJsonPath('errors.teacher_id.0', 'Giáo viên phụ trách không thể đồng thời là trợ giảng.');

    expect($class->fresh()->teacher_id)->toBe($oldLeadId)
        ->and($class->fresh()->assistantTeachers()->whereKey($newLead->profile_id)->exists())->toBeTrue();
});

test('class update rechecks that a preserved assistant cannot also become the lead', function () {
    $class = SchoolClass::factory()->create(['name' => 'Original']);
    $newLead = TeacherProfile::factory()->create();
    $class->assistantTeachers()->attach($newLead->profile_id);

    expect(fn () => app(UpdateClassAction::class)->handle($class->id, [
        'name' => 'Must Roll Back',
        'subject_id' => $class->subject_id,
        'teacher_id' => $newLead->profile_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ]))->toThrow(ValidationException::class);

    expect($class->fresh()->name)->toBe('Original')
        ->and($class->fresh()->teacher_id)->not->toBe($newLead->profile_id);
});

test('an explicit class update can promote an assistant when it removes the assistant role', function () {
    $class = SchoolClass::factory()->create();
    $newLead = TeacherProfile::factory()->create();
    $retainedAssistant = TeacherProfile::factory()->create();
    $class->assistantTeachers()->attach([$newLead->profile_id, $retainedAssistant->profile_id]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $newLead->profile_id,
        'assistant_teacher_ids' => [$retainedAssistant->profile_id],
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertOk()
        ->assertJsonPath('data.teacher_id', $newLead->profile_id)
        ->assertJsonCount(1, 'data.assistant_teachers')
        ->assertJsonPath('data.assistant_teachers.0.id', $retainedAssistant->profile_id);
});

test('an explicit class update synchronizes the full subject set and assistant team', function () {
    $class = SchoolClass::factory()->create();
    $previousExtra = Subject::factory()->create();
    $class->subjects()->attach($previousExtra->id);
    $extra = Subject::factory()->create();
    $assistant = TeacherProfile::factory()->create();
    $nextAssistant = TeacherProfile::factory()->create();

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'subject_ids' => [$class->subject_id, $extra->id],
        'teacher_id' => $class->teacher_id,
        'assistant_teacher_ids' => [$assistant->profile_id, $nextAssistant->profile_id],
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertOk()
        ->assertJsonCount(2, 'data.subjects')
        ->assertJsonCount(2, 'data.assistant_teachers');

    expect($class->fresh()->subjects()->pluck('subjects.id')->all())->toContain($class->subject_id, $extra->id)
        ->not->toContain($previousExtra->id)
        ->and($class->fresh()->assistantTeachers()->pluck('teacher_profiles.profile_id')->all())->toContain($assistant->profile_id, $nextAssistant->profile_id);
});

test('an explicitly empty assistant list clears the class team', function () {
    $class = SchoolClass::factory()->create();
    $assistant = TeacherProfile::factory()->create();
    $class->assistantTeachers()->attach($assistant->profile_id);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'assistant_teacher_ids' => [],
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertOk()->assertJsonCount(0, 'data.assistant_teachers');

    expect($class->fresh()->assistantTeachers()->exists())->toBeFalse();
});

test('class edits reject an ineligible additional subject and leave all class data unchanged', function () {
    $class = SchoolClass::factory()->create([
        'name' => 'Original',
        'grade_level' => GradeLevel::Grade9,
    ]);
    $wrongGrade = Subject::factory()->create(['grade_levels' => [GradeLevel::Grade1->value]]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => 'Must Roll Back',
        'subject_id' => $class->subject_id,
        'subject_ids' => [$class->subject_id, $wrongGrade->id],
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này không áp dụng cho khối 9.');

    expect($class->fresh()->name)->toBe('Original')
        ->and($class->fresh()->subjects()->count())->toBe(1);
});

test('class edits reject an inactive assistant without changing class data or relationships', function () {
    $class = SchoolClass::factory()->create(['name' => 'Original']);
    $inactive = TeacherProfile::factory()->inactive()->create();

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => 'Must Roll Back',
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'assistant_teacher_ids' => [$inactive->profile_id],
        'grade_level' => $class->grade_level->value,
        'max_students' => $class->max_students,
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Trợ giảng này không còn làm việc, không thể gán cho lớp.');

    expect($class->fresh()->name)->toBe('Original')
        ->and($class->fresh()->assistantTeachers()->exists())->toBeFalse();
});

test('a class cannot be opened against a locked subject', function () {
    $subject = Subject::factory()->inactive()->create();

    $this->postJson('/api/v1/academic/classes', classPayload(['subject_id' => $subject->id]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này đã bị khóa, không thể mở lớp mới.');

    $this->assertDatabaseCount('classes', 0);
});

test('a class cannot be opened for a grade its subject does not apply to', function () {
    $subject = Subject::factory()->create(['grade_levels' => [GradeLevel::Grade1->value]]);

    $this->postJson('/api/v1/academic/classes', classPayload([
        'subject_id' => $subject->id,
        'grade_level' => GradeLevel::Grade9->value,
    ]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này không áp dụng cho khối 9.');

    $this->assertDatabaseCount('classes', 0);
});

test('a class cannot be opened under a teacher who has left', function () {
    $teacher = TeacherProfile::factory()->inactive()->create();

    $this->postJson('/api/v1/academic/classes', classPayload(['teacher_id' => $teacher->profile_id]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Giáo viên này không còn làm việc, không thể phụ trách lớp.');
});

test('a duplicate class code is reported against the code field', function () {
    SchoolClass::factory()->create(['code' => 'TOAN-9A']);

    $this->postJson('/api/v1/academic/classes', classPayload())
        ->assertJsonValidationErrorFor('code')
        ->assertJsonPath('errors.code.0', 'Mã lớp này đã tồn tại. Vui lòng đặt mã khác.');
});

test('a class end date cannot precede its opening date', function () {
    $this->postJson('/api/v1/academic/classes', classPayload([
        'start_at' => '2026-03-01',
        'end_at' => '2026-02-01',
    ]))
        ->assertJsonValidationErrorFor('end_at')
        ->assertJsonPath('errors.end_at.0', 'Ngày kết thúc không thể trước ngày khai giảng.');
});

test('the class code and opening date never change after creation', function () {
    $class = SchoolClass::factory()->create([
        'code' => 'CODE-GIU',
        'start_at' => '2026-01-10',
    ]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => 'Tên mới',
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => GradeLevel::Grade8->value,
        'max_students' => 30,
        'code' => 'CODE-MOI',
        'start_at' => '2026-06-01',
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Tên mới')
        ->assertJsonPath('data.code', 'CODE-GIU')
        ->assertJsonPath('data.start_at', '2026-01-10');
});

test('capacity cannot drop below the students already holding a place', function () {
    $class = SchoolClass::factory()->create(['max_students' => 10]);
    ClassEnrollment::factory()->count(3)->create(['class_id' => $class->id]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => 2,
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Sĩ số tối đa (2) không thể nhỏ hơn số học sinh đang học trong lớp (3).');

    expect($class->fresh()->max_students)->toBe(10);
});

test('capacity may be set to exactly the current headcount', function () {
    $class = SchoolClass::factory()->create(['max_students' => 10]);
    ClassEnrollment::factory()->count(3)->create(['class_id' => $class->id]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => 3,
    ])->assertOk()->assertJsonPath('data.max_students', 3);
});

test('a class capacity accepts the PostgreSQL smallint maximum', function () {
    $this->postJson('/api/v1/academic/classes', classPayload(['max_students' => 32767]))
        ->assertCreated()
        ->assertJsonPath('data.max_students', 32767);
});

test('a class capacity above the PostgreSQL smallint range is refused as a field error', function () {
    $class = SchoolClass::factory()->create();

    $this->postJson('/api/v1/academic/classes', classPayload(['max_students' => 32768]))
        ->assertJsonValidationErrorFor('max_students');

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => 32768,
    ])->assertJsonValidationErrorFor('max_students');
});

test('a class cannot be handed to a teacher who has left', function () {
    $class = SchoolClass::factory()->create();
    $gone = TeacherProfile::factory()->inactive()->create();

    $result = app(UpdateClassAction::class)->handle($class->id, [
        'teacher_id' => $gone->profile_id,
        'max_students' => 20,
    ]);

    expect($result->getError())->toBe(AcademicError::TeacherInactive);
});

test('keeping the existing subject and teacher is allowed even once they are locked', function () {
    $class = SchoolClass::factory()->create();
    $class->subject->forceFill(['is_active' => false])->save();
    $class->teacher->forceFill(['status' => 1])->save();

    $result = app(UpdateClassAction::class)->handle($class->id, [
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'max_students' => 25,
    ]);

    expect($result->isSuccess())->toBeTrue()
        ->and($class->fresh()->max_students)->toBe(25);
});

test('a class cannot change to a grade its subject does not apply to', function () {
    $subject = Subject::factory()->create(['grade_levels' => [GradeLevel::Grade1->value]]);
    $class = SchoolClass::factory()->create([
        'subject_id' => $subject->id,
        'grade_level' => GradeLevel::Grade1,
    ]);

    $this->putJson("/api/v1/academic/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $subject->id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => GradeLevel::Grade9->value,
        'max_students' => $class->max_students,
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này không áp dụng cho khối 9.');

    expect($class->fresh()->grade_level)->toBe(GradeLevel::Grade1);
});

test('ending a class closes every enrolment still open and stamps the end date', function () {
    $class = SchoolClass::factory()->create();
    $open = ClassEnrollment::factory()->count(2)->create(['class_id' => $class->id]);
    $leavingLater = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'left_at' => now()->addMonth()->toDateString(),
    ]);
    $alreadyLeft = ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);
    $leftOn = $alreadyLeft->left_at->toDateString();

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => ClassStatus::Ended->value])
        ->assertOk()
        ->assertJsonPath('data.status', ClassStatus::Ended->value)
        ->assertJsonPath('data.end_at', now()->toDateString())
        ->assertJsonPath('data.active_students_count', 0);

    foreach ($open as $enrollment) {
        expect($enrollment->fresh()->left_at->toDateString())->toBe(now()->toDateString());
    }

    expect($leavingLater->fresh()->left_at->toDateString())->toBe(now()->toDateString())
        ->and($alreadyLeft->fresh()->left_at->toDateString())->toBe($leftOn);
});

test('ending a class keeps an end date that was already set', function () {
    $class = SchoolClass::factory()->create(['end_at' => '2026-09-30']);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => ClassStatus::Ended->value])
        ->assertOk()
        ->assertJsonPath('data.end_at', '2026-09-30');
});

test('reopening a class restores the status but not the closed enrolments', function () {
    $class = SchoolClass::factory()->create();
    $enrollment = ClassEnrollment::factory()->create(['class_id' => $class->id]);

    app(ChangeClassStatusAction::class)->handle($class->id, ClassStatus::Ended);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => ClassStatus::Active->value])
        ->assertOk()
        ->assertJsonPath('data.status', ClassStatus::Active->value)
        ->assertJsonPath('data.active_students_count', 0);

    expect($enrollment->fresh()->left_at)->not->toBeNull();
});

test('a class cannot reopen while any additional subject is locked', function () {
    $class = SchoolClass::factory()->ended()->create();
    $locked = Subject::factory()->inactive()->create();
    $class->subjects()->attach($locked->id, ['is_primary' => false]);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => ClassStatus::Active->value])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này đã bị khóa, không thể mở lại lớp.');

    expect($class->fresh()->status)->toBe(ClassStatus::Ended);
});

test('a class cannot reopen once its subject no longer applies to its grade', function () {
    $subject = Subject::factory()->create(['grade_levels' => [GradeLevel::Grade1->value]]);
    $class = SchoolClass::factory()->ended()->create([
        'subject_id' => $subject->id,
        'grade_level' => GradeLevel::Grade9,
    ]);

    $this->patchJson("/api/v1/academic/classes/{$class->id}/status", ['status' => ClassStatus::Active->value])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này không áp dụng cho khối 9.');

    expect($class->fresh()->status)->toBe(ClassStatus::Ended);
});

test('the class list reports its subject, teacher, and headcount', function () {
    $class = SchoolClass::factory()->create();
    ClassEnrollment::factory()->count(2)->create(['class_id' => $class->id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);

    $this->getJson('/api/v1/academic/classes')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.subject_name', $class->subject->name)
        ->assertJsonPath('data.0.teacher_name', $class->teacher->profile->full_name)
        ->assertJsonPath('data.0.active_students_count', 2);
});

test('the class list filters by status, subject, teacher, and grade', function () {
    $target = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade10]);
    SchoolClass::factory()->ended()->create(['grade_level' => GradeLevel::Grade7]);

    $this->getJson('/api/v1/academic/classes?status[]='.ClassStatus::Active->value)
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $target->id);

    $this->getJson('/api/v1/academic/classes?subject_id[]='.$target->subject_id)
        ->assertOk()->assertJsonPath('meta.total', 1);

    $additionalSubject = Subject::factory()->create();
    $target->subjects()->attach($additionalSubject->id);
    $this->getJson('/api/v1/academic/classes?subject_id[]='.$additionalSubject->id)
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $target->id);

    $this->getJson('/api/v1/academic/classes?teacher_id[]='.$target->teacher_id)
        ->assertOk()->assertJsonPath('meta.total', 1);

    $this->getJson('/api/v1/academic/classes?grade_level[]='.GradeLevel::Grade10->value)
        ->assertOk()->assertJsonPath('meta.total', 1);
});

test('the class option list offers only running classes', function () {
    $running = SchoolClass::factory()->create(['code' => 'DANG-CHAY', 'name' => 'Lớp đang chạy']);
    SchoolClass::factory()->ended()->create(['code' => 'DA-XONG']);

    $this->getJson('/api/v1/academic/classes/options')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $running->id)
        ->assertJsonPath('data.0.label', 'Lớp đang chạy (DANG-CHAY)');
});

test('a missing class is reported as not found', function () {
    expect(app(GetClassAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::ClassNotFound)
        ->and(app(ChangeClassStatusAction::class)->handle(9999, ClassStatus::Ended)->getError())
        ->toBe(AcademicError::ClassNotFound);

    $this->getJson('/api/v1/academic/classes/9999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lớp học.');
});
