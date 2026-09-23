<?php

use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use Illuminate\Support\Facades\Hash;

function actingAdminForPassword(): User
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    test()->withToken($admin->createToken('admin')->plainTextToken);

    return $admin;
}

test('student password change revokes only the changed account tokens', function () {
    $student = StudentProfile::factory()->create();
    $targetToken = $student->profile->user->createToken('target')->plainTextToken;
    $unrelated = User::factory()->create(['role' => UserRole::Admin]);
    $unrelatedToken = $unrelated->createToken('unrelated')->plainTextToken;
    actingAdminForPassword();

    $this->patchJson('/api/v1/academic/students/'.$student->profile_id.'/password', ['password' => 'newpass123'])
        ->assertNoContent();

    $this->app['auth']->forgetGuards();
    $this->withToken($targetToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
    $this->app['auth']->forgetGuards();
    $this->withToken($unrelatedToken)->getJson('/api/v1/auth/me')->assertOk();
});

test('failed password validation keeps the target password and token', function () {
    $teacher = TeacherProfile::factory()->create();
    $targetToken = $teacher->profile->user->createToken('target')->plainTextToken;
    $oldHash = $teacher->profile->user->password;
    actingAdminForPassword();

    $this->patchJson('/api/v1/academic/teachers/'.$teacher->profile_id.'/password', ['password' => 'short'])
        ->assertUnprocessable();

    expect($teacher->profile->user->fresh()->password)->toBe($oldHash);
    $this->app['auth']->forgetGuards();
    $this->withToken($targetToken)->getJson('/api/v1/auth/me')->assertOk();
});

test('password change revokes only the changed account tokens after a successful save', function () {
    $teacher = TeacherProfile::factory()->create();
    $targetToken = $teacher->profile->user->createToken('target')->plainTextToken;
    $unrelated = User::factory()->create(['role' => UserRole::Admin]);
    $unrelatedToken = $unrelated->createToken('unrelated')->plainTextToken;
    actingAdminForPassword();

    $this->patchJson('/api/v1/academic/teachers/'.$teacher->profile_id.'/password', ['password' => 'newpass123'])
        ->assertNoContent();

    $this->app['auth']->forgetGuards();
    $this->withToken($targetToken)->getJson('/api/v1/auth/me')->assertUnauthorized();
    $this->app['auth']->forgetGuards();
    $this->withToken($unrelatedToken)->getJson('/api/v1/auth/me')->assertOk();
    expect(Hash::check('newpass123', $teacher->profile->user->fresh()->password))->toBeTrue();
});
