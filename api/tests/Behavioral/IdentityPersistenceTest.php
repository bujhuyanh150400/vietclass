<?php

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;

test('it persists fork-compatible user identity with typed roles', function () {
    $user = User::factory()->create([
        'username' => 'teacher_one',
        'password' => 'password',
        'role' => UserRole::Teacher,
        'is_active' => true,
    ]);

    expect($user->role)->toBe(UserRole::Teacher)
        ->and($user->is_active)->toBeTrue()
        ->and(Hash::check('password', $user->password))->toBeTrue();

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'teacher_one',
        'role' => UserRole::Teacher->value,
        'is_active' => true,
    ]);
});

test('it exposes the persisted values of an int-backed role enum', function () {
    expect(UserRole::values())->toBe([0, 1, 2, 3]);
});

test('it seeds one idempotent development administrator', function () {
    $this->seed();
    $this->seed();

    $this->assertDatabaseCount('users', 1)
        ->assertDatabaseHas('users', [
            'username' => 'admin@admin.com',
            'role' => UserRole::Admin->value,
            'is_active' => true,
        ]);

    $user = User::query()->where('username', 'admin@admin.com')->firstOrFail();

    expect(Hash::check('password', $user->password))->toBeTrue();
});

test('the teacher and student enums are cast in both directions', function () {
    $student = StudentProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Student)->create(['gender' => Gender::Female])->id,
        'status' => StudentStatus::Paused,
    ]);
    $teacher = TeacherProfile::factory()->inactive()->create();

    expect($student->profile->fresh()->gender)->toBe(Gender::Female)
        ->and($student->fresh()->status)->toBe(StudentStatus::Paused)
        ->and($teacher->fresh()->status)->toBe(TeacherStatus::Inactive);

    $this->assertDatabaseHas('student_profiles', ['profile_id' => $student->profile_id, 'status' => 1]);
    $this->assertDatabaseHas('profiles', ['id' => $student->profile_id, 'gender' => 1]);
});

test('student status values start at zero rather than the fork numbering', function () {
    expect(StudentStatus::values())->toBe([0, 1, 2]);
});

test('database defaults match the values a new teacher or student starts with', function () {
    $student = new StudentProfile;
    $teacher = new TeacherProfile;

    expect($student->status)->toBe(StudentStatus::Studying)
        ->and($teacher->status)->toBe(TeacherStatus::Active);
});

test('one login account carries at most one profile', function () {
    $profile = Profile::factory()->forRole(UserRole::Teacher)->create();

    expect(fn () => Profile::factory()->create(['user_id' => $profile->user_id]))
        ->toThrow(QueryException::class);
});

test('a teacher profile is created with a teacher login account', function () {
    $teacher = TeacherProfile::factory()->create();
    $student = StudentProfile::factory()->create();

    expect($teacher->profile->user->role)->toBe(UserRole::Teacher)
        ->and($student->profile->user->role)->toBe(UserRole::Student);
});

test('identity enums keep the stored integer contract', function () {
    expect(UserRole::values())->toBe([0, 1, 2, 3])
        ->and(UserRole::Student->value)->toBe(2)
        ->and(UserRole::Guardian->value)->toBe(3)
        ->and(TeacherStatus::values())->toBe([0, 1])
        ->and(GuardianRelationship::values())->toBe([0, 1, 2])
        ->and(GuardianRelationship::Mother->value)->toBe(1);
});
