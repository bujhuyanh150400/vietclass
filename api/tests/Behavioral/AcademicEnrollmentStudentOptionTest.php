<?php

use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;

beforeEach(function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($admin->createToken('test')->plainTextToken);
});

test('student option search matches the profile phone number', function () {
    $class = SchoolClass::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $student->profile->update(['phone' => '0987654321']);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollment-student-options?q=0987654321")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $student->profile_id);
});

test('student options page eligible and disabled candidates while available-students stays compatible', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 10,
    ]);

    $eligible = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $eligible->profile->update(['full_name' => 'Nguyễn An']);

    $wrongGrade = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade8]);
    $wrongGrade->profile->update(['full_name' => 'Bảo Bình']);

    $alreadyEnrolled = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $alreadyEnrolled->profile->update(['full_name' => 'Châu Chi']);
    ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'student_id' => $alreadyEnrolled->profile_id,
    ]);

    $locked = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);
    $locked->profile->user->forceFill(['is_active' => false])->save();
    $locked->profile->update(['full_name' => 'Dũng Đỗ']);

    $profileWithoutAccount = Profile::factory()->create(['full_name' => 'Hà Hồ']);
    $withoutAccount = StudentProfile::factory()->create([
        'profile_id' => $profileWithoutAccount->id,
        'grade_level' => GradeLevel::Grade9,
    ]);

    $this->getJson("/api/v1/academic/classes/{$class->id}/enrollment-student-options?q=nguyen&per_page=1")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $eligible->profile_id)
        ->assertJsonPath('data.0.is_eligible', true)
        ->assertJsonPath('data.0.disabled_reason', null);

    $options = collect($this->getJson("/api/v1/academic/classes/{$class->id}/enrollment-student-options?per_page=50")
        ->assertOk()
        ->json('data'))
        ->keyBy('id');

    expect($options)->toHaveCount(5)
        ->and($options->get($wrongGrade->profile_id)['disabled_reason'])->toBe('grade_mismatch')
        ->and($options->get($alreadyEnrolled->profile_id)['disabled_reason'])->toBe('already_enrolled')
        ->and($options->get($locked->profile_id)['disabled_reason'])->toBe('account_inactive')
        ->and($options->get($withoutAccount->profile_id)['disabled_reason'])->toBe('account_missing')
        ->and($options->get($alreadyEnrolled->profile_id)['active_enrollments'][0]['class_id'])->toBe($class->id);

    $this->getJson("/api/v1/academic/classes/{$class->id}/available-students")
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $eligible->profile_id);
});

test('student options disable every candidate when a class is full or ended', function () {
    $fullClass = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'max_students' => 1,
    ]);
    ClassEnrollment::factory()->create(['class_id' => $fullClass->id]);
    $fullClassCandidate = StudentProfile::factory()->create(['grade_level' => GradeLevel::Grade9]);

    $this->getJson("/api/v1/academic/classes/{$fullClass->id}/enrollment-student-options?q={$fullClassCandidate->profile_id}")
        ->assertOk()
        ->assertJsonPath('data.0.id', $fullClassCandidate->profile_id)
        ->assertJsonPath('data.0.is_eligible', false)
        ->assertJsonPath('data.0.disabled_reason', 'class_full');

    $endedClass = SchoolClass::factory()->ended()->create(['grade_level' => GradeLevel::Grade9]);
    $this->getJson("/api/v1/academic/classes/{$endedClass->id}/enrollment-student-options?q={$fullClassCandidate->profile_id}")
        ->assertOk()
        ->assertJsonPath('data.0.id', $fullClassCandidate->profile_id)
        ->assertJsonPath('data.0.is_eligible', false)
        ->assertJsonPath('data.0.disabled_reason', 'class_ended');
});
