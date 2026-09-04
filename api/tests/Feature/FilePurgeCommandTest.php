<?php

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToDeleteFile;

beforeEach(function (): void {
    Storage::fake('managed-files');
    $this->owner = Profile::factory()->forRole(UserRole::Student)->create()->user;
});

test('purge command retains metadata and fails when object deletion fails', function (): void {
    CarbonImmutable::setTestNow('2026-09-04 12:00:00+00');
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/failed.png",
        'deleted_at' => now()->subDays(31),
    ]);
    $disk = Mockery::mock(Filesystem::class);
    $disk->shouldReceive('exists')->once()->with($file->path)->andReturnTrue();
    $disk->shouldReceive('delete')->once()->with($file->path)
        ->andThrow(UnableToDeleteFile::atLocation($file->path));
    Storage::shouldReceive('disk')->once()->with('managed-files')->andReturn($disk);
    Log::shouldReceive('warning')->once()->with('Managed file deletion failed.', [
        'file_id' => $file->id,
        'owner_id' => $this->owner->id,
        'disk' => 'managed-files',
        'path' => $file->path,
    ]);

    $this->artisan('files:purge-trash')->assertFailed();

    expect(ManagedFile::withTrashed()->find($file->id)?->deleted_at)->not->toBeNull();
    CarbonImmutable::setTestNow();
});

test('the purge command is registered in the daily scheduler without overlap', function (): void {
    $this->artisan('schedule:list')
        ->assertSuccessful()
        ->expectsOutputToContain('files:purge-trash');
});
