<?php

use App\Modules\Academic\Actions\LeaveClassAction;
use App\Modules\Academic\Actions\TransferEnrollmentAction;
use App\Modules\Academic\Actions\UpdateEnrollmentAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\User;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

test('students are enrolled into a class from a shared join date', function () {
    $class = SchoolClass::factory()->create(['start_at' => now()->subMonth()->toDateString()]);
    $students = StudentProfile::factory()->count(2)->create();

    $this->postJson("/api/v1/classes/{$class->id}/enrollments", [
        'student_ids' => $students->pluck('profile_id')->all(),
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertCreated()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.is_active', true)
        ->assertJsonPath('data.0.enrolled_at', now()->toDateString());

    $this->assertDatabaseCount('class_enrollments', 2);
});

test('the same student listed twice in one request is enrolled once', function () {
    $class = SchoolClass::factory()->create();
    $student = StudentProfile::factory()->create();

    $this->postJson("/api/v1/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id, $student->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertCreated()
        ->assertJsonCount(1, 'data');
});

test('a join date cannot precede the class opening date', function () {
    $class = SchoolClass::factory()->create(['start_at' => '2026-03-01']);
    $student = StudentProfile::factory()->create();

    $this->postJson("/api/v1/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => '2026-02-28',
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ngày vào lớp không thể trước ngày khai giảng (01/03/2026).');

    $this->assertDatabaseCount('class_enrollments', 0);
});

test('a batch that would overfill the class is refused outright', function () {
    $class = SchoolClass::factory()->create(['max_students' => 2]);
    ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $students = StudentProfile::factory()->count(2)->create();

    $this->postJson("/api/v1/classes/{$class->id}/enrollments", [
        'student_ids' => $students->pluck('profile_id')->all(),
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Lớp đã đạt sĩ số tối đa (1/2 học sinh), không thể thêm.');

    $this->assertDatabaseCount('class_enrollments', 1);
});

test('a student already studying in the class cannot be enrolled again', function () {
    $existing = ClassEnrollment::factory()->create();

    $this->postJson("/api/v1/classes/{$existing->class_id}/enrollments", [
        'student_ids' => [$existing->student_id],
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Học sinh '.$existing->student->profile->full_name.' đang học trong lớp này rồi.');
});

test('a student who left may be enrolled again and keeps the earlier period', function () {
    $previous = ClassEnrollment::factory()->left()->create();

    $this->postJson("/api/v1/classes/{$previous->class_id}/enrollments", [
        'student_ids' => [$previous->student_id],
        'enrolled_at' => now()->toDateString(),
    ])->assertCreated();

    expect(ClassEnrollment::query()
        ->where('class_id', $previous->class_id)
        ->where('student_id', $previous->student_id)
        ->count())->toBe(2)
        ->and($previous->fresh()->left_at)->not->toBeNull();
});

test('a finished class refuses every enrolment operation', function () {
    $class = SchoolClass::factory()->ended()->create();
    $student = StudentProfile::factory()->create();
    $enrollment = ClassEnrollment::factory()->create(['class_id' => $class->id]);

    $this->postJson("/api/v1/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])->assertStatus(409)
        ->assertJsonPath('message', 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.');

    expect(app(UpdateEnrollmentAction::class)->handle($enrollment->id, ['enrolled_at' => now()->toDateString()])->getError())
        ->toBe(AcademicError::ClassNotActive)
        ->and(app(LeaveClassAction::class)->handle($enrollment->id, now()->toDateString(), 'x')->getError())
        ->toBe(AcademicError::ClassNotActive);
});

test('a roster reports every period including the ones already left', function () {
    $class = SchoolClass::factory()->create();
    ClassEnrollment::factory()->create(['class_id' => $class->id]);
    ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);

    $this->getJson("/api/v1/classes/{$class->id}/enrollments")
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonStructure(['data' => [['id', 'student_name', 'enrolled_at', 'left_at', 'is_active']]]);

    $this->getJson("/api/v1/classes/{$class->id}/enrollments?active_only=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.is_active', true);
});

test('the available student list hides those already studying in the class', function () {
    $class = SchoolClass::factory()->create();
    $enrolled = ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $returning = ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);
    $fresh = StudentProfile::factory()->create();
    $locked = StudentProfile::factory()->create();
    $locked->profile->user->forceFill(['is_active' => false])->save();

    $response = $this->getJson("/api/v1/classes/{$class->id}/available-students")->assertOk();
    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($fresh->profile_id, $returning->student_id)
        ->and($ids)->not->toContain($enrolled->student_id)
        ->and($ids)->not->toContain($locked->profile_id);
});

test('the available student list includes a file avatar without resource queries', function (): void {
    $class = SchoolClass::factory()->create();
    $student = StudentProfile::factory()->create();
    $file = ManagedFile::factory()->for($student->profile->user, 'owner')->create();
    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => $student->profile_id,
    ]);
    $student->profile->forceFill(['avatar_config' => ['type' => 'file']])->save();

    $available = collect($this->getJson("/api/v1/classes/{$class->id}/available-students")
        ->assertOk()
        ->json('data'))
        ->firstWhere('id', $student->profile_id);

    expect($available['avatar'])
        ->toMatchArray([
            'type' => 'file',
            'file_id' => $file->id,
            'content_url' => "/api/v1/files/{$file->id}/content",
        ]);
});

test('an enrolment date may be corrected on a closed period', function () {
    $enrollment = ClassEnrollment::factory()->left()->create();

    $this->putJson("/api/v1/enrollments/{$enrollment->id}", [
        'enrolled_at' => now()->subDays(3)->toDateString(),
        'left_at' => now()->subDay()->toDateString(),
        'note' => 'Sửa lại ngày',
    ])
        ->assertOk()
        ->assertJsonPath('data.note', 'Sửa lại ngày')
        ->assertJsonPath('data.enrolled_at', now()->subDays(3)->toDateString());
});

test('a leave date cannot precede the join date', function () {
    $enrollment = ClassEnrollment::factory()->create(['enrolled_at' => now()->toDateString()]);

    $this->putJson("/api/v1/enrollments/{$enrollment->id}", [
        'enrolled_at' => now()->toDateString(),
        'left_at' => now()->subWeek()->toDateString(),
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ngày rời lớp không thể trước ngày vào lớp ('.now()->format('d/m/Y').').');
});

test('reopening a closed period is refused while another one is running', function () {
    $running = ClassEnrollment::factory()->create();
    $closed = ClassEnrollment::factory()->left()->create([
        'class_id' => $running->class_id,
        'student_id' => $running->student_id,
    ]);

    $this->putJson("/api/v1/enrollments/{$closed->id}", [
        'enrolled_at' => $closed->enrolled_at->toDateString(),
        'left_at' => null,
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Học sinh đã có một bản ghi đang học khác trong lớp này.');
});

test('ending a membership keeps the record and appends the reason', function () {
    $enrollment = ClassEnrollment::factory()->create(['note' => 'Ghi chú cũ']);

    $this->postJson("/api/v1/enrollments/{$enrollment->id}/leave", [
        'left_at' => now()->toDateString(),
        'reason' => 'Chuyển trường',
    ])
        ->assertOk()
        ->assertJsonPath('data.left_at', now()->toDateString())
        ->assertJsonPath('data.is_active', false)
        ->assertJsonPath('data.note', "Ghi chú cũ\n[Nghỉ học]: Chuyển trường");

    $this->assertDatabaseHas('class_enrollments', ['id' => $enrollment->id]);
});

test('ending a membership requires a reason', function () {
    $enrollment = ClassEnrollment::factory()->create();

    $this->postJson("/api/v1/enrollments/{$enrollment->id}/leave", [
        'left_at' => now()->toDateString(),
    ])
        ->assertJsonValidationErrorFor('reason')
        ->assertJsonPath('errors.reason.0', 'Vui lòng nhập lý do nghỉ học.');
});

test('a membership already ended cannot be ended again', function () {
    $enrollment = ClassEnrollment::factory()->left()->create();

    expect(app(LeaveClassAction::class)->handle($enrollment->id, now()->toDateString(), 'x')->getError())
        ->toBe(AcademicError::EnrollmentNotActive);
});

test('a transfer closes the old period and opens a new one the same day', function () {
    $enrollment = ClassEnrollment::factory()->create();
    $target = SchoolClass::factory()->create([
        'subject_id' => $enrollment->schoolClass->subject_id,
        'code' => 'LOP-MOI',
    ]);

    $this->postJson("/api/v1/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $target->id,
        'left_at' => now()->toDateString(),
    ])
        ->assertCreated()
        ->assertJsonPath('data.class_id', $target->id)
        ->assertJsonPath('data.enrolled_at', now()->toDateString())
        ->assertJsonPath('data.is_active', true);

    $old = $enrollment->fresh();

    expect($old->left_at->toDateString())->toBe(now()->toDateString())
        ->and($old->note)->toContain('[Chuyển sang lớp: LOP-MOI]');
});

test('a transfer target must teach the same subject', function () {
    $enrollment = ClassEnrollment::factory()->create();
    $other = SchoolClass::factory()->create();

    $this->postJson("/api/v1/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $other->id,
        'left_at' => now()->toDateString(),
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Chỉ được chuyển học sinh sang lớp cùng môn học.');

    expect($enrollment->fresh()->left_at)->toBeNull();
});

test('a transfer target must still be running', function () {
    $enrollment = ClassEnrollment::factory()->create();
    $ended = SchoolClass::factory()->ended()->create([
        'subject_id' => $enrollment->schoolClass->subject_id,
    ]);

    expect(app(TransferEnrollmentAction::class)
        ->handle($enrollment->id, $ended->id, now()->toDateString())
        ->getError())->toBe(AcademicError::TransferTargetNotActive);
});

test('a transfer into a full class is refused and changes nothing', function () {
    $enrollment = ClassEnrollment::factory()->create();
    $target = SchoolClass::factory()->create([
        'subject_id' => $enrollment->schoolClass->subject_id,
        'max_students' => 1,
    ]);
    ClassEnrollment::factory()->create(['class_id' => $target->id]);

    $this->postJson("/api/v1/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $target->id,
        'left_at' => now()->toDateString(),
    ])->assertStatus(409);

    expect($enrollment->fresh()->left_at)->toBeNull();
});

test('a missing enrolment is reported as not found', function () {
    expect(app(UpdateEnrollmentAction::class)->handle(9999, ['enrolled_at' => now()->toDateString()])->getError())
        ->toBe(AcademicError::EnrollmentNotFound)
        ->and(app(LeaveClassAction::class)->handle(9999, now()->toDateString(), 'x')->getError())
        ->toBe(AcademicError::EnrollmentNotFound)
        ->and(app(TransferEnrollmentAction::class)->handle(9999, 1, now()->toDateString())->getError())
        ->toBe(AcademicError::EnrollmentNotFound);
});

test('a roster for a missing class is reported as not found', function () {
    $this->getJson('/api/v1/classes/9999/enrollments')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lớp học.');

    $this->getJson('/api/v1/classes/9999/available-students')->assertNotFound();
});
