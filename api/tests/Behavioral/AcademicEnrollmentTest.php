<?php

use App\Modules\Academic\Actions\LeaveClassAction;
use App\Modules\Academic\Actions\TransferEnrollmentAction;
use App\Modules\Academic\Actions\UpdateEnrollmentAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\Subject;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use App\Modules\System\Enums\FileLinkType;
use App\Modules\System\Models\FileLink;
use App\Modules\System\Models\ManagedFile;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

test('students are enrolled into a class from a shared join date', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'start_at' => now()->subMonth()->toDateString(),
    ]);
    $students = StudentProfile::factory()->count(2)->create(['grade_level' => GradeLevel::Grade9]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => $students->pluck('profile_id')->all(),
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertCreated()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.is_active', true)
        ->assertJsonPath('data.0.enrolled_at', now()->toDateString());

    $this->assertDatabaseCount('class_enrollments', 2);
});

test('class roster can filter to enrollment periods with a note', function () {
    $class = SchoolClass::factory()->create();
    $withNote = ClassEnrollment::factory()->create(['class_id' => $class->id, 'note' => 'Cần gọi phụ huynh.']);
    ClassEnrollment::factory()->create(['class_id' => $class->id, 'note' => null]);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollments?active_only=1&has_note=1")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $withNote->id);
});

test('class roster search matches a student profile id as the enrollment code', function () {
    $class = SchoolClass::factory()->create();
    $student = StudentProfile::factory()->create();
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
    ]);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollments?q={$student->profile_id}&active_only=1")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $enrollment->id);
});

test('a grade-mismatched student rejects the whole enrollment batch', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 10,
    ]);
    $matching = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $mismatched = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade8]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$matching->profile_id, $mismatched->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Học sinh '.$mismatched->profile->full_name.' không cùng khối với lớp.');

    $this->assertDatabaseCount('class_enrollments', 0);
});

test('a locked student cannot be enrolled even when sent directly to the API', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student->profile->user->forceFill(['is_active' => false])->save();

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Tài khoản học sinh đã bị khóa, không thể ghi danh.');

    $this->assertDatabaseCount('class_enrollments', 0);
});

test('the same student listed twice in one request is enrolled once', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id, $student->profile_id],
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertCreated()
        ->assertJsonCount(1, 'data');
});

test('a join date cannot precede the class opening date', function () {
    $class = SchoolClass::factory()->create(['start_at' => '2026-03-01']);
    $student = StudentProfile::factory()->create();

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => [$student->profile_id],
        'enrolled_at' => '2026-02-28',
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ngày vào lớp không thể trước ngày khai giảng (01/03/2026).');

    $this->assertDatabaseCount('class_enrollments', 0);
});

test('a batch that would overfill the class is refused outright', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 2,
    ]);
    ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $students = StudentProfile::factory()->count(2)->create(['grade_level' => GradeLevel::Grade9]);

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
        'student_ids' => $students->pluck('profile_id')->all(),
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Lớp đã đạt sĩ số tối đa (1/2 học sinh), không thể thêm.');

    $this->assertDatabaseCount('class_enrollments', 1);
});

test('a student already studying in the class cannot be enrolled again', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $existing = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
    ]);

    $this->postJson("/api/v1/academic/classes/{$existing->class_id}/enrollments", [
        'student_ids' => [$existing->student_id],
        'enrolled_at' => now()->toDateString(),
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Học sinh '.$existing->student->profile->full_name.' đang học trong lớp này rồi.');
});

test('a student who left may be enrolled again and keeps the earlier period', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $previous = ClassEnrollment::factory()->left()->create([
        'class_id' => $class->id,
        'student_id' => $student->profile_id,
    ]);

    $this->postJson("/api/v1/academic/classes/{$previous->class_id}/enrollments", [
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

    $this->postJson("/api/v1/academic/classes/{$class->id}/enrollments", [
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

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollments")
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonStructure(['data' => [['id', 'student_name', 'enrolled_at', 'left_at', 'is_active']]]);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollments?active_only=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.is_active', true);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollments?left_only=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.is_active', false);
});

test('the available student list hides those already studying in the class', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrolled = ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $returningStudent = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $returning = ClassEnrollment::factory()->left()->create([
        'class_id' => $class->id,
        'student_id' => $returningStudent->profile_id,
    ]);
    $fresh = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $locked = StudentProfile::factory()->create();
    $locked->profile->user->forceFill(['is_active' => false])->save();

    $response = $this->getJson("/api/v1/academic/classes/{$class->id}/available-students")->assertOk();
    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($fresh->profile_id, $returning->student_id)
        ->and($ids)->not->toContain($enrolled->student_id)
        ->and($ids)->not->toContain($locked->profile_id);
});

test('the available student list only offers students in the class grade', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $matching = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $otherGrade = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade8]);

    $ids = collect($this->getJson("/api/v1/academic/classes/{$class->id}/available-students")
        ->assertOk()
        ->json('data'))
        ->pluck('id');

    expect($ids)->toContain($matching->profile_id)
        ->and($ids)->not->toContain($otherGrade->profile_id);
});

test('the available student list includes a file avatar without resource queries', function (): void {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $file = ManagedFile::factory()->for($student->profile->user, 'owner')->create();
    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => $student->profile_id,
    ]);
    $student->profile->forceFill(['avatar_config' => ['type' => 'file']])->save();

    $available = collect($this->getJson("/api/v1/academic/classes/{$class->id}/available-students")
        ->assertOk()
        ->json('data'))
        ->firstWhere('id', $student->profile_id);

    expect($available['avatar'])
        ->toMatchArray([
            'type' => 'file',
            'file_id' => $file->id,
            'content_url' => "/api/v1/system/files/{$file->id}/content",
        ]);
});

test('an enrolment date may be corrected on a closed period', function () {
    $enrollment = ClassEnrollment::factory()->left()->create();

    $this->putJson("/api/v1/academic/enrollments/{$enrollment->id}", [
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

    $this->putJson("/api/v1/academic/enrollments/{$enrollment->id}", [
        'enrolled_at' => now()->toDateString(),
        'left_at' => now()->subWeek()->toDateString(),
    ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Ngày rời lớp không thể trước ngày vào lớp ('.now()->format('d/m/Y').').');
});

test('reopening a closed period cannot exceed class capacity', function () {
    $class = SchoolClass::factory()->create([
        'start_at' => '2026-01-01',
        'max_students' => 1,
    ]);
    ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $closed = ClassEnrollment::factory()->left()->create([
        'class_id' => $class->id,
        'enrolled_at' => '2026-02-01',
        'left_at' => '2026-06-01',
    ]);

    $this->putJson("/api/v1/academic/enrollments/{$closed->id}", [
        'enrolled_at' => '2026-02-01',
        'left_at' => null,
    ])->assertStatus(409)
        ->assertJsonPath('message', 'Lớp đã đạt sĩ số tối đa (1/1 học sinh), không thể thêm.');

    expect($closed->fresh()->left_at->toDateString())->toBe('2026-06-01');
});

test('reopening a closed period is refused while another one is running', function () {
    $running = ClassEnrollment::factory()->create();
    $closed = ClassEnrollment::factory()->left()->create([
        'class_id' => $running->class_id,
        'student_id' => $running->student_id,
    ]);

    $this->putJson("/api/v1/academic/enrollments/{$closed->id}", [
        'enrolled_at' => $closed->enrolled_at->toDateString(),
        'left_at' => null,
    ])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Học sinh đã có một bản ghi đang học khác trong lớp này.');
});

test('ending a membership keeps the record and appends the reason', function () {
    $enrollment = ClassEnrollment::factory()->create(['note' => 'Ghi chú cũ']);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/leave", [
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

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/leave", [
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
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $target = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'code' => 'LOP-MOI',
    ]);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
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

test('a locked student cannot transfer even when sent directly to the API', function () {
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student->profile->user->forceFill(['is_active' => false])->save();
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
        'left_at' => now()->toDateString(),
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Tài khoản học sinh đã bị khóa, không thể ghi danh.');

    expect($enrollment->fresh()->left_at)->toBeNull()
        ->and(ClassEnrollment::query()->where('class_id', $target->id)->exists())->toBeFalse();
});

test('a transfer target must match the student grade', function () {
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $target = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade8,
    ]);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $target->id,
        'left_at' => now()->toDateString(),
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Học sinh không cùng khối với lớp mới.');

    expect($enrollment->fresh()->left_at)->toBeNull()
        ->and(ClassEnrollment::query()->where('class_id', $target->id)->exists())->toBeFalse();
});

test('a transfer target must have the same complete subject set', function () {
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
    $target->subjects()->attach(Subject::factory()->create()->id, ['is_primary' => false]);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
        'class_id' => $target->id,
        'left_at' => now()->toDateString(),
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Chỉ được chuyển học sinh sang lớp cùng môn học.');

    expect($enrollment->fresh()->left_at)->toBeNull()
        ->and(ClassEnrollment::query()->where('class_id', $target->id)->exists())->toBeFalse();
});

test('a transfer target must teach the same subject', function () {
    $enrollment = ClassEnrollment::factory()->create();
    $other = SchoolClass::factory()->create();

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
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
    $source = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $enrollment = ClassEnrollment::factory()->create([
        'class_id' => $source->id,
        'student_id' => $student->profile_id,
    ]);
    $target = SchoolClass::factory()->create([
        'subject_id' => $source->subject_id,
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 1,
    ]);
    ClassEnrollment::factory()->create(['class_id' => $target->id]);

    $this->postJson("/api/v1/academic/enrollments/{$enrollment->id}/transfer", [
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
    $this->getJson('/api/v1/academic/classes/9999/enrollments')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy lớp học.');

    $this->getJson('/api/v1/academic/classes/9999/available-students')->assertNotFound();
});
