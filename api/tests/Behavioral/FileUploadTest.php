<?php

use App\Modules\FileManagement\Actions\UploadFileAction;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\System\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake('managed-files');
    config()->set('file-management.disk', 'managed-files');
    $this->student = Profile::factory()->forRole(UserRole::Student)->create()->user;
});

test('upload stores a private object beneath the target owner prefix', function (): void {
    $response = $this->withToken($this->student->createToken('test')->plainTextToken)->post('/api/v1/files', [
        'file' => UploadedFile::fake()->image('avatar.jpg'),
    ]);

    $response->assertCreated()
        ->assertJsonMissingPath('data.disk')
        ->assertJsonMissingPath('data.path');

    $file = ManagedFile::query()->sole();

    expect($file->path)->toMatch("#^users/{$this->student->id}/[0-9a-f-]+\\.jpg$#");
    Storage::disk('managed-files')->assertExists($file->path);
});

test('an administrator can upload for another existing owner', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;

    $this->withToken($admin->createToken('test')->plainTextToken)->post('/api/v1/files', [
        'file' => UploadedFile::fake()->image('avatar.jpg'),
        'owner_user_id' => $this->student->id,
    ])->assertCreated()->assertJsonPath('data.owner_id', $this->student->id);

    expect(ManagedFile::query()->sole()->owner_user_id)->toBe($this->student->id);
});

test('trashed bytes still count toward the upload quota', function (): void {
    SystemSetting::factory()->create([
        'key' => 'file_storage.quotas',
        'value' => ['admin' => 1024, 'teacher' => 1024, 'student' => 1024, 'guardian' => 1024],
    ]);
    ManagedFile::factory()->for($this->student, 'owner')->create(['size_bytes' => 500]);
    ManagedFile::factory()->for($this->student, 'owner')->trashed()->create(['size_bytes' => 400]);

    $this->withToken($this->student->createToken('test')->plainTextToken)->post('/api/v1/files', [
        'file' => UploadedFile::fake()->createWithContent('notes.txt', str_repeat('a', 200)),
    ])->assertConflict();

    expect(ManagedFile::withTrashed()->where('owner_user_id', $this->student->id)->count())->toBe(2);
    expect(Storage::disk('managed-files')->allFiles())->toBe([]);
});

test('a second upload cannot enter while the owner lock is held', function (): void {
    $lock = Cache::lock("file-upload-owner:{$this->student->id}", 300);
    expect($lock->get())->toBeTrue();

    $result = app(UploadFileAction::class)->handle(
        actor: $this->student,
        upload: UploadedFile::fake()->createWithContent('notes.txt', 'content'),
        displayName: null,
        ownerUserId: null,
    );

    expect($result->getError())->toBe(FileError::StorageUnavailable);
    $lock->release();
});

test('a failed storage write becomes a storage-unavailable result without file metadata', function (): void {
    $disk = Mockery::mock();
    $disk->shouldReceive('putFileAs')->once()->andReturnFalse();
    $disk->shouldReceive('delete')->once()->andReturnTrue();
    Storage::shouldReceive('disk')->twice()->with('managed-files')->andReturn($disk);

    $result = app(UploadFileAction::class)->handle(
        actor: $this->student,
        upload: UploadedFile::fake()->createWithContent('notes.txt', 'content'),
        displayName: null,
        ownerUserId: null,
    );

    expect($result->getError())->toBe(FileError::StorageUnavailable);
    $this->assertDatabaseCount('files', 0);
});

test('an administrator receives the identity error for a missing requested owner', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;

    $result = app(UploadFileAction::class)->handle(
        actor: $admin,
        upload: UploadedFile::fake()->createWithContent('notes.txt', 'content'),
        displayName: null,
        ownerUserId: 999_999,
    );

    expect($result->getError()->value)->toBe('IDENTITY-004');
});

test('the owner lock releases after the outer transaction commits and rolls back', function (): void {
    DB::transaction(function (): void {
        $result = app(UploadFileAction::class)->handle(
            actor: $this->student,
            upload: UploadedFile::fake()->createWithContent('notes.txt', 'commit'),
            displayName: null,
            ownerUserId: null,
        );

        expect($result->isSuccess())->toBeTrue();
        expect(Cache::lock("file-upload-owner:{$this->student->id}", 300)->get())->toBeFalse();
    });

    $committedLock = Cache::lock("file-upload-owner:{$this->student->id}", 300);
    expect($committedLock->get())->toBeTrue();
    $committedLock->release();

    try {
        DB::transaction(function (): void {
            $result = app(UploadFileAction::class)->handle(
                actor: $this->student,
                upload: UploadedFile::fake()->createWithContent('rollback.txt', 'rollback'),
                displayName: null,
                ownerUserId: null,
            );

            expect($result->isSuccess())->toBeTrue();
            throw new RuntimeException('rollback');
        });
    } catch (RuntimeException) {
        // The rollback itself is the behavior under test.
    }

    $rolledBackLock = Cache::lock("file-upload-owner:{$this->student->id}", 300);
    expect($rolledBackLock->get())->toBeTrue();
    $rolledBackLock->release();
    expect(Storage::disk('managed-files')->allFiles())->toHaveCount(1);
});

test('usage reports active and trashed bytes for the resolved owner', function (): void {
    ManagedFile::factory()->for($this->student, 'owner')->create(['size_bytes' => 500]);
    ManagedFile::factory()->for($this->student, 'owner')->trashed()->create(['size_bytes' => 400]);

    $this->withToken($this->student->createToken('test')->plainTextToken)->getJson('/api/v1/files/usage')
        ->assertOk()
        ->assertJsonPath('data.owner_id', $this->student->id)
        ->assertJsonPath('data.used_bytes', 900)
        ->assertJsonPath('data.remaining_bytes', 524_287_100)
        ->assertJsonPath('data.exceeded', false);
});
