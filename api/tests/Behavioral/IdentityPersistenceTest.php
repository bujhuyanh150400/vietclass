<?php

use App\Modules\Identity\Enums\EmployeeStatus;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Models\Teacher;
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
    $student = Student::factory()->create([
        'gender' => Gender::Female,
        'status' => StudentStatus::Paused,
    ]);
    $teacher = Teacher::factory()->inactive()->create();

    expect($student->fresh()->gender)->toBe(Gender::Female)
        ->and($student->fresh()->status)->toBe(StudentStatus::Paused)
        ->and($teacher->fresh()->status)->toBe(EmployeeStatus::Inactive);

    $this->assertDatabaseHas('students', ['id' => $student->id, 'gender' => 1, 'status' => 1]);
});

test('student status values start at zero rather than the fork numbering', function () {
    expect(StudentStatus::values())->toBe([0, 1, 2]);
});

test('database defaults match the values a new teacher or student starts with', function () {
    $student = new Student;
    $teacher = new Teacher;

    expect($student->status)->toBe(StudentStatus::Studying)
        ->and($teacher->status)->toBe(EmployeeStatus::Active);
});

test('a teacher phone and email cannot be reused', function () {
    Teacher::factory()->create(['phone' => '0900000001', 'email' => 'gv@vietclass.test']);

    expect(fn () => Teacher::factory()->create(['phone' => '0900000001']))
        ->toThrow(QueryException::class)
        ->and(fn () => Teacher::factory()->create(['email' => 'gv@vietclass.test']))
        ->toThrow(QueryException::class);
});

test('one login account carries at most one teacher profile', function () {
    $teacher = Teacher::factory()->create();

    expect(fn () => Teacher::factory()->create(['user_id' => $teacher->user_id]))
        ->toThrow(QueryException::class);
});

test('a teacher profile is created with a teacher login account', function () {
    $teacher = Teacher::factory()->create();
    $student = Student::factory()->create();

    expect($teacher->user->role)->toBe(UserRole::Teacher)
        ->and($student->user->role)->toBe(UserRole::Student);
});
