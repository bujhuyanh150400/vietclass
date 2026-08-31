<?php

use App\Modules\Academic\Actions\ChangeClassStatusAction;
use App\Modules\Academic\Actions\GetClassAction;
use App\Modules\Academic\Actions\UpdateClassAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;

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
    $this->postJson('/api/v1/classes', classPayload())
        ->assertCreated()
        ->assertJsonPath('data.code', 'TOAN-9A')
        ->assertJsonPath('data.status', ClassStatus::Active->value)
        ->assertJsonPath('data.active_students_count', 0);
});

test('a class cannot be opened against a locked subject', function () {
    $subject = Subject::factory()->inactive()->create();

    $this->postJson('/api/v1/classes', classPayload(['subject_id' => $subject->id]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Môn học này đã bị khóa, không thể mở lớp mới.');

    $this->assertDatabaseCount('classes', 0);
});

test('a class cannot be opened under a teacher who has left', function () {
    $teacher = TeacherProfile::factory()->inactive()->create();

    $this->postJson('/api/v1/classes', classPayload(['teacher_id' => $teacher->profile_id]))
        ->assertStatus(422)
        ->assertJsonPath('message', 'Giáo viên này không còn làm việc, không thể phụ trách lớp.');
});

test('a duplicate class code is reported against the code field', function () {
    SchoolClass::factory()->create(['code' => 'TOAN-9A']);

    $this->postJson('/api/v1/classes', classPayload())
        ->assertJsonValidationErrorFor('code')
        ->assertJsonPath('errors.code.0', 'Mã lớp này đã tồn tại. Vui lòng đặt mã khác.');
});

test('a class end date cannot precede its opening date', function () {
    $this->postJson('/api/v1/classes', classPayload([
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

    $this->putJson("/api/v1/classes/{$class->id}", [
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

    $this->putJson("/api/v1/classes/{$class->id}", [
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

    $this->putJson("/api/v1/classes/{$class->id}", [
        'name' => $class->name,
        'subject_id' => $class->subject_id,
        'teacher_id' => $class->teacher_id,
        'grade_level' => $class->grade_level->value,
        'max_students' => 3,
    ])->assertOk()->assertJsonPath('data.max_students', 3);
});

test('a class capacity accepts the PostgreSQL smallint maximum', function () {
    $this->postJson('/api/v1/classes', classPayload(['max_students' => 32767]))
        ->assertCreated()
        ->assertJsonPath('data.max_students', 32767);
});

test('a class capacity above the PostgreSQL smallint range is refused as a field error', function () {
    $class = SchoolClass::factory()->create();

    $this->postJson('/api/v1/classes', classPayload(['max_students' => 32768]))
        ->assertJsonValidationErrorFor('max_students');

    $this->putJson("/api/v1/classes/{$class->id}", [
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

test('ending a class closes every enrolment still open and stamps the end date', function () {
    $class = SchoolClass::factory()->create();
    $open = ClassEnrollment::factory()->count(2)->create(['class_id' => $class->id]);
    $leavingLater = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'left_at' => now()->addMonth()->toDateString(),
    ]);
    $alreadyLeft = ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);
    $leftOn = $alreadyLeft->left_at->toDateString();

    $this->patchJson("/api/v1/classes/{$class->id}/status", ['status' => ClassStatus::Ended->value])
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

    $this->patchJson("/api/v1/classes/{$class->id}/status", ['status' => ClassStatus::Ended->value])
        ->assertOk()
        ->assertJsonPath('data.end_at', '2026-09-30');
});

test('reopening a class restores the status but not the closed enrolments', function () {
    $class = SchoolClass::factory()->create();
    $enrollment = ClassEnrollment::factory()->create(['class_id' => $class->id]);

    app(ChangeClassStatusAction::class)->handle($class->id, ClassStatus::Ended);

    $this->patchJson("/api/v1/classes/{$class->id}/status", ['status' => ClassStatus::Active->value])
        ->assertOk()
        ->assertJsonPath('data.status', ClassStatus::Active->value)
        ->assertJsonPath('data.active_students_count', 0);

    expect($enrollment->fresh()->left_at)->not->toBeNull();
});

test('the class list reports its subject, teacher, and headcount', function () {
    $class = SchoolClass::factory()->create();
    ClassEnrollment::factory()->count(2)->create(['class_id' => $class->id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);

    $this->getJson('/api/v1/classes')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.subject_name', $class->subject->name)
        ->assertJsonPath('data.0.teacher_name', $class->teacher->profile->full_name)
        ->assertJsonPath('data.0.active_students_count', 2);
});

test('the class list filters by status, subject, teacher, and grade', function () {
    $target = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade10]);
    SchoolClass::factory()->ended()->create(['grade_level' => GradeLevel::Grade7]);

    $this->getJson('/api/v1/classes?status[]='.ClassStatus::Active->value)
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $target->id);

    $this->getJson('/api/v1/classes?subject_id[]='.$target->subject_id)
        ->assertOk()->assertJsonPath('meta.total', 1);

    $this->getJson('/api/v1/classes?teacher_id[]='.$target->teacher_id)
        ->assertOk()->assertJsonPath('meta.total', 1);

    $this->getJson('/api/v1/classes?grade_level[]='.GradeLevel::Grade10->value)
        ->assertOk()->assertJsonPath('meta.total', 1);
});

test('the class option list offers only running classes', function () {
    $running = SchoolClass::factory()->create(['code' => 'DANG-CHAY', 'name' => 'Lớp đang chạy']);
    SchoolClass::factory()->ended()->create(['code' => 'DA-XONG']);

    $this->getJson('/api/v1/classes/options')
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

    $this->getJson('/api/v1/classes/9999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lớp học.');
});
