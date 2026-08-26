<?php

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
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
