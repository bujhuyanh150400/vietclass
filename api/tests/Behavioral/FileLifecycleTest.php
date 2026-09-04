<?php

use App\Modules\FileManagement\Actions\PermanentlyDeleteFileAction;
use App\Modules\FileManagement\Actions\PurgeTrashedFilesAction;
use App\Modules\FileManagement\Actions\RestoreFileAction;
use App\Modules\FileManagement\Actions\TrashFileAction;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake('managed-files');
    config()->set('file-management.disk', 'managed-files');
    $this->owner = Profile::factory()->forRole(UserRole::Student)->create()->user;
    $this->token = $this->owner->createToken('test')->plainTextToken;
});

test('a linked file cannot be trashed or permanently deleted', function (): void {
    $active = ManagedFile::factory()->for($this->owner, 'owner')->create();
    FileLink::factory()->for($active, 'file')->create();
    $trashed = ManagedFile::factory()->for($this->owner, 'owner')->trashed()->create();
    FileLink::factory()->for($trashed, 'file')->create();

    $this->withToken($this->token)->deleteJson("/api/v1/files/{$active->id}")
        ->assertConflict()
        ->assertJsonPath('message', 'Tệp đang được sử dụng.');

    expect(app(TrashFileAction::class)->handle(actor: $this->owner, fileId: $active->id)->getError())
        ->toBe(FileError::Linked)
        ->and(app(PermanentlyDeleteFileAction::class)->handle(actor: $this->owner, fileId: $trashed->id)->getError())
        ->toBe(FileError::Linked);
});

test('an active unlinked file can be trashed and restored', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create();

    $this->withToken($this->token)->deleteJson("/api/v1/files/{$file->id}")->assertNoContent();
    expect($file->fresh()?->deleted_at)->not->toBeNull();

    $this->withToken($this->token)->postJson("/api/v1/files/{$file->id}/restore")
        ->assertOk()
        ->assertJsonPath('data.id', $file->id)
        ->assertJsonPath('data.trashed_at', null);
    expect($file->fresh()?->deleted_at)->toBeNull();
});

test('lifecycle actions reject a file in the wrong state', function (): void {
    $active = ManagedFile::factory()->for($this->owner, 'owner')->create();
    $trashed = ManagedFile::factory()->for($this->owner, 'owner')->trashed()->create();

    expect(app(TrashFileAction::class)->handle(actor: $this->owner, fileId: $trashed->id)->getError())
        ->toBe(FileError::LifecycleConflict)
        ->and(app(RestoreFileAction::class)->handle(actor: $this->owner, fileId: $active->id)->getError())
        ->toBe(FileError::LifecycleConflict)
        ->and(app(PermanentlyDeleteFileAction::class)->handle(actor: $this->owner, fileId: $active->id)->getError())
        ->toBe(FileError::LifecycleConflict);
});

test('permanent deletion removes trashed metadata when the storage object is already missing', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->trashed()->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/missing.png",
    ]);

    $this->withToken($this->token)->deleteJson("/api/v1/files/{$file->id}/permanent")->assertNoContent();

    expect(ManagedFile::withTrashed()->find($file->id))->toBeNull();
});

test('permanent deletion retains trashed metadata when the storage object cannot be deleted', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->trashed()->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/failed.png",
    ]);
    $disk = Mockery::mock(Filesystem::class);
    $disk->shouldReceive('exists')->once()->with($file->path)->andReturnTrue();
    $disk->shouldReceive('delete')->once()->with($file->path)->andReturnFalse();
    Storage::shouldReceive('disk')->once()->with('managed-files')->andReturn($disk);
    Log::shouldReceive('warning')->once()->with('Managed file deletion failed.', [
        'file_id' => $file->id,
        'owner_id' => $this->owner->id,
        'disk' => 'managed-files',
        'path' => $file->path,
    ]);

    $result = app(PermanentlyDeleteFileAction::class)->handle(actor: $this->owner, fileId: $file->id);

    expect($result->getError())->toBe(FileError::StorageUnavailable)
        ->and(ManagedFile::withTrashed()->find($file->id)?->deleted_at)->not->toBeNull();
});

test('purge removes files at the exact thirty day boundary and processes more than one chunk', function (): void {
    CarbonImmutable::setTestNow('2026-09-04 12:00:00+00');
    $files = ManagedFile::factory()->count(101)->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'deleted_at' => now()->subDays(30),
    ]);

    foreach ($files as $file) {
        Storage::disk('managed-files')->put($file->path, 'content');
    }

    $result = app(PurgeTrashedFilesAction::class)->handle();

    expect($result)->toBe(['purged' => 101, 'failed' => 0, 'linked' => 0])
        ->and(ManagedFile::withTrashed()->count())->toBe(0);
    CarbonImmutable::setTestNow();
});

test('purge retains a twenty-nine day file and a linked thirty-one day file', function (): void {
    CarbonImmutable::setTestNow('2026-09-04 12:00:00+00');
    $recent = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'deleted_at' => now()->subDays(29),
    ]);
    $linked = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'deleted_at' => now()->subDays(31),
    ]);
    FileLink::factory()->for($linked, 'file')->create();

    $result = app(PurgeTrashedFilesAction::class)->handle();

    expect($result)->toBe(['purged' => 0, 'failed' => 0, 'linked' => 1])
        ->and(ManagedFile::withTrashed()->find($recent->id)?->deleted_at)->not->toBeNull()
        ->and(ManagedFile::withTrashed()->find($linked->id)?->deleted_at)->not->toBeNull();
    CarbonImmutable::setTestNow();
});
