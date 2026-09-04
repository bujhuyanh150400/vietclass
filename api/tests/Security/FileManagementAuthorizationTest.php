<?php

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use Illuminate\Http\UploadedFile;

dataset('non-admin file owners', [
    'teacher' => UserRole::Teacher,
    'student' => UserRole::Student,
    'guardian' => UserRole::Guardian,
]);

test('file endpoints require authentication', function (): void {
    $this->withHeader('Accept', 'application/json')
        ->post('/api/v1/files', ['file' => UploadedFile::fake()->image('avatar.jpg')])
        ->assertUnauthorized();
    $this->getJson('/api/v1/files/usage')->assertUnauthorized();
    $this->getJson('/api/v1/files/owner-options')->assertUnauthorized();
    $this->getJson('/api/v1/files')->assertUnauthorized();
    $this->getJson('/api/v1/files/1')->assertUnauthorized();
    $this->putJson('/api/v1/files/1', ['display_name' => 'Renamed'])->assertUnauthorized();
    $this->getJson('/api/v1/files/1/content')->assertUnauthorized();
});

test('a non administrator cannot submit an owner and always uses their own library', function (UserRole $role): void {
    $actor = Profile::factory()->forRole($role)->create()->user;
    $other = Profile::factory()->forRole(UserRole::Student)->create()->user;

    $this->withToken($actor->createToken('test')->plainTextToken)->post('/api/v1/files', [
        'file' => UploadedFile::fake()->image('avatar.jpg'),
        'owner_user_id' => $other->id,
    ])->assertUnprocessable()->assertJsonValidationErrorFor('owner_user_id');

    $this->withToken($actor->createToken('usage')->plainTextToken)->getJson("/api/v1/files/usage?owner_user_id={$other->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('owner_user_id');

    $this->withToken($actor->createToken('list')->plainTextToken)->getJson("/api/v1/files?owner_user_id={$other->id}")
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('owner_user_id');
})->with('non-admin file owners');

test('cross-owner file access is always indistinguishable from a missing file', function (UserRole $role): void {
    $actor = Profile::factory()->forRole($role)->create()->user;
    $other = Profile::factory()->forRole(UserRole::Student)->create()->user;
    $file = ManagedFile::factory()->for($other, 'owner')->create();

    $token = $actor->createToken('test')->plainTextToken;
    $this->withToken($token)->getJson("/api/v1/files/{$file->id}")->assertNotFound();
    $this->withToken($token)->putJson("/api/v1/files/{$file->id}", [
        'display_name' => 'Forbidden rename',
    ])->assertNotFound();
    $this->withToken($token)->getJson("/api/v1/files/{$file->id}/content")->assertNotFound();

    expect($file->fresh()->display_name)->not->toBe('Forbidden rename');
})->with('non-admin file owners');

test('owner options are restricted to administrators by the request', function (UserRole $role): void {
    $user = Profile::factory()->forRole($role)->create()->user;

    $this->withToken($user->createToken('test')->plainTextToken)->getJson('/api/v1/files/owner-options')->assertForbidden();
})->with('non-admin file owners');

test('an administrator can search owner options without receiving storage details', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;
    $owner = Profile::factory()->forRole(UserRole::Student)->create(['full_name' => 'Nguyen Upload'])->user;

    $this->withToken($admin->createToken('test')->plainTextToken)->getJson('/api/v1/files/owner-options?q=Nguyen')
        ->assertOk()
        ->assertJsonPath('data.0.id', $owner->id)
        ->assertJsonPath('data.0.label', 'Nguyen Upload')
        ->assertJsonMissingPath('data.0.disk')
        ->assertJsonMissingPath('data.0.path');
});
