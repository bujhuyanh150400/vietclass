<?php

use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;

beforeEach(function (): void {
    $this->profile = Profile::factory()->forRole(UserRole::Student)->create();
    $this->owner = $this->profile->user;
    $this->token = $this->owner->createToken('avatar')->plainTextToken;
});

test('selecting an owned image stores a file union and one avatar link', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create();

    $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
        'type' => 'file',
        'file_id' => $file->id,
    ])->assertOk()
        ->assertJsonPath('data.type', 'file')
        ->assertJsonPath('data.file_id', $file->id)
        ->assertJsonPath('data.content_url', "/api/v1/files/{$file->id}/content");

    expect($this->profile->fresh()->avatar_config)->toBe(['type' => 'file'])
        ->and(FileLink::query()
            ->where('type', FileLinkType::ProfileAvatar)
            ->where('foreign_id', $this->profile->id)
            ->count())->toBe(1);
});

test('none clears the avatar union and its link', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create();
    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => $this->profile->id,
    ]);
    $this->profile->forceFill(['avatar_config' => ['type' => 'file']])->save();

    $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
        'type' => 'none',
    ])->assertOk()->assertJsonPath('data', null);

    expect($this->profile->fresh()->avatar_config)->toBeNull()
        ->and(FileLink::query()
            ->where('type', FileLinkType::ProfileAvatar)
            ->where('foreign_id', $this->profile->id)
            ->exists())->toBeFalse();
});

test('each supported DiceBear style replaces a file link with safe configuration', function (string $style): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create();
    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => $this->profile->id,
    ]);

    $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
        'type' => 'dicebear',
        'style' => $style,
        'seed' => 'stableSeed',
        'options' => ['flip' => 'horizontal', 'scale' => 7],
    ])->assertOk()
        ->assertJsonPath('data.type', 'dicebear')
        ->assertJsonPath('data.style', $style)
        ->assertJsonPath('data.seed', 'stableSeed');

    $config = $this->profile->fresh()->avatar_config;

    expect($config['type'])->toBe('dicebear')
        ->and($config['style'])->toBe($style)
        ->and($config['seed'])->toBe('stableSeed')
        ->and($config['options'])->toBe(['flip' => 'horizontal', 'scale' => 7])
        ->and(FileLink::query()
            ->where('type', FileLinkType::ProfileAvatar)
            ->where('foreign_id', $this->profile->id)
            ->exists())->toBeFalse();
})->with(['lorelei', 'notionists', 'thumbs']);

test('a replacement leaves exactly one avatar link', function (): void {
    $first = ManagedFile::factory()->for($this->owner, 'owner')->create();
    $second = ManagedFile::factory()->for($this->owner, 'owner')->create();

    foreach ([$first, $second] as $file) {
        $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
            'type' => 'file',
            'file_id' => $file->id,
        ])->assertOk();
    }

    expect(FileLink::query()
        ->where('type', FileLinkType::ProfileAvatar)
        ->where('foreign_id', $this->profile->id)
        ->pluck('file_id')->all())->toBe([$second->id]);
});

test('the selected avatar remains protected by the file lifecycle', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create();

    $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
        'type' => 'file',
        'file_id' => $file->id,
    ])->assertOk();

    $this->withToken($this->token)->deleteJson("/api/v1/files/{$file->id}")
        ->assertConflict();
});

test('file selection rejects a wrong owner, trashed file, and non-image', function (): void {
    $other = Profile::factory()->forRole(UserRole::Student)->create()->user;
    $wrongOwner = ManagedFile::factory()->for($other, 'owner')->create();
    $trashed = ManagedFile::factory()->for($this->owner, 'owner')->create(['deleted_at' => now()]);
    $document = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
    ]);

    foreach ([$wrongOwner, $trashed, $document] as $file) {
        $this->withToken($this->token)->putJson("/api/v1/profiles/{$this->profile->id}/avatar", [
            'type' => 'file',
            'file_id' => $file->id,
        ])->assertNotFound();
    }
});

test('the avatar request rejects unknown, invalid, and oversized DiceBear input', function (): void {
    $path = "/api/v1/profiles/{$this->profile->id}/avatar";

    $this->withToken($this->token)->putJson($path, [
        'type' => 'dicebear',
        'style' => 'lorelei',
        'seed' => 'seed',
        'options' => ['title' => 'unsafe'],
    ])->assertUnprocessable()->assertJsonValidationErrorFor('avatar');

    $this->withToken($this->token)->putJson($path, [
        'type' => 'dicebear',
        'style' => 'lorelei',
        'seed' => 'seed',
        'options' => ['rotate' => 361],
    ])->assertUnprocessable()->assertJsonValidationErrorFor('avatar');

    $this->withToken($this->token)->putJson($path, [
        'type' => 'dicebear',
        'style' => 'lorelei',
        'seed' => str_repeat('a', 16 * 1024),
        'options' => [],
    ])->assertUnprocessable()->assertJsonValidationErrorFor('avatar');
});

test('an accountless profile can select none or DiceBear but never a file', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;
    $profile = Profile::factory()->create();
    $token = $admin->createToken('admin-avatar')->plainTextToken;
    $path = "/api/v1/profiles/{$profile->id}/avatar";

    $this->withToken($token)->putJson($path, ['type' => 'none'])->assertOk();
    $this->withToken($token)->putJson($path, [
        'type' => 'dicebear', 'style' => 'thumbs', 'seed' => 'seed', 'options' => [],
    ])->assertOk();
    $this->withToken($token)->putJson($path, [
        'type' => 'file', 'file_id' => ManagedFile::factory()->create()->id,
    ])->assertNotFound();
});
