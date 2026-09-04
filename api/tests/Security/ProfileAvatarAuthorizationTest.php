<?php

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;

test('avatar updates require authentication', function (): void {
    $profile = Profile::factory()->forRole(UserRole::Student)->create();

    $this->putJson("/api/v1/profiles/{$profile->id}/avatar", ['type' => 'none'])
        ->assertUnauthorized();
});

test('a non administrator cannot update another profile', function (UserRole $role): void {
    $actor = Profile::factory()->forRole($role)->create()->user;
    $profile = Profile::factory()->forRole(UserRole::Student)->create();

    $this->withToken($actor->createToken('avatar')->plainTextToken)
        ->putJson("/api/v1/profiles/{$profile->id}/avatar", ['type' => 'none'])
        ->assertForbidden();
})->with([UserRole::Teacher, UserRole::Student, UserRole::Guardian]);

test('an administrator may update any profile', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;
    $profile = Profile::factory()->forRole(UserRole::Student)->create();

    $this->withToken($admin->createToken('avatar')->plainTextToken)
        ->putJson("/api/v1/profiles/{$profile->id}/avatar", ['type' => 'none'])
        ->assertOk();
});

test('a non administrator cannot attach another users image to their own profile', function (): void {
    $profile = Profile::factory()->forRole(UserRole::Student)->create();
    $file = ManagedFile::factory()->create();

    $this->withToken($profile->user->createToken('avatar')->plainTextToken)
        ->putJson("/api/v1/profiles/{$profile->id}/avatar", [
            'type' => 'file', 'file_id' => $file->id,
        ])->assertNotFound();
});
