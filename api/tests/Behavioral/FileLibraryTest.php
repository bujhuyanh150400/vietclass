<?php

use App\Modules\FileManagement\Actions\GetFileContentAction;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\UnableToGenerateTemporaryUrl;

beforeEach(function (): void {
    Storage::fake('managed-files');
    config()->set('file-management.disk', 'managed-files');
    $this->owner = Profile::factory()->forRole(UserRole::Student)->create([
        'full_name' => 'Nguyen Owner',
    ])->user;
    $this->ownerToken = $this->owner->createToken('test')->plainTextToken;
});

test('file list scopes owners and returns the complete safe resource shape', function (): void {
    $mine = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/mine.png",
    ]);
    FileLink::factory()->for($mine, 'file')->create(['type' => FileLinkType::ProfileAvatar]);
    ManagedFile::factory()->create();

    $this->withToken($this->ownerToken)->getJson('/api/v1/files')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $mine->id)
        ->assertJsonPath('data.0.owner.id', $this->owner->id)
        ->assertJsonPath('data.0.owner.display_name', 'Nguyen Owner')
        ->assertJsonPath('data.0.owner.role', UserRole::Student->value)
        ->assertJsonPath('data.0.category', 'image')
        ->assertJsonPath('data.0.is_linked', true)
        ->assertJsonPath('data.0.link_types.0', FileLinkType::ProfileAvatar->value)
        ->assertJsonPath('data.0.trashed_at', null)
        ->assertJsonPath('data.0.content_url', "/api/v1/files/{$mine->id}/content")
        ->assertJsonMissingPath('data.0.owner_id')
        ->assertJsonMissingPath('data.0.disk')
        ->assertJsonMissingPath('data.0.path');
});

test('administrator file list applies every exact metadata filter', function (): void {
    $admin = Profile::factory()->forRole(UserRole::Admin)->create()->user;
    $adminToken = $admin->createToken('test')->plainTextToken;
    $matching = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Weekly plan',
        'original_name' => 'lesson-week-1.pdf',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-09-15 12:00:00+00',
    ]);
    FileLink::factory()->for($matching, 'file')->create(['type' => FileLinkType::ProfileAvatar]);

    ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Unrelated',
        'original_name' => 'notes.txt',
        'path' => 'lesson-is-only-in-the-path.pdf',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-09-15 12:00:00+00',
    ]);
    ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Lesson image',
        'extension' => 'png',
        'created_at' => '2026-09-15 12:00:00+00',
    ]);
    ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Lesson old',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-08-31 23:59:59+00',
    ]);
    ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Lesson unlinked',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-09-15 12:00:00+00',
    ]);
    $otherOwnerMatch = ManagedFile::factory()->create([
        'display_name' => 'Lesson other owner',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-09-15 12:00:00+00',
    ]);
    FileLink::factory()->for($otherOwnerMatch, 'file')->create(['type' => FileLinkType::ProfileAvatar]);
    $afterRange = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'display_name' => 'Lesson future',
        'extension' => 'pdf',
        'mime_type' => 'application/pdf',
        'created_at' => '2026-10-01 00:00:00+00',
    ]);
    FileLink::factory()->for($afterRange, 'file')->create(['type' => FileLinkType::ProfileAvatar]);

    $this->withToken($adminToken)->getJson('/api/v1/files?per_page=20')
        ->assertOk()
        ->assertJsonPath('meta.total', 7);

    $this->withToken($adminToken)
        ->getJson('/api/v1/files?search=lesson&category=pdf&owner_user_id='.$this->owner->id.'&uploaded_from=2026-09-01&uploaded_to=2026-09-30&trash=active&link_type=0&per_page=20')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $matching->id);

    $this->withToken($adminToken)->getJson('/api/v1/files?search=Unrelated')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

test('file list supports exact trash selection and newest first pagination', function (): void {
    $older = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'created_at' => '2026-09-01 12:00:00+00',
    ]);
    $newer = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'created_at' => '2026-09-02 12:00:00+00',
    ]);
    $trashed = ManagedFile::factory()->for($this->owner, 'owner')->trashed()->create();

    $this->withToken($this->ownerToken)->getJson('/api/v1/files?per_page=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('data.0.id', $newer->id);

    $this->withToken($this->ownerToken)->getJson('/api/v1/files?per_page=1&page=2')
        ->assertOk()
        ->assertJsonPath('data.0.id', $older->id);

    $this->withToken($this->ownerToken)->getJson('/api/v1/files?trash=trashed')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $trashed->id)
        ->assertJsonPath('data.0.trashed_at', $trashed->deleted_at->toIso8601String());
});

test('file list honors validated metadata sorting', function (): void {
    $zulu = ManagedFile::factory()->for($this->owner, 'owner')->create(['display_name' => 'Zulu']);
    $alpha = ManagedFile::factory()->for($this->owner, 'owner')->create(['display_name' => 'Alpha']);

    $this->withToken($this->ownerToken)->getJson('/api/v1/files?sort=display_name&direction=asc')
        ->assertOk()
        ->assertJsonPath('data.0.id', $alpha->id)
        ->assertJsonPath('data.1.id', $zulu->id);

    $this->withToken($this->ownerToken)->getJson('/api/v1/files?sort=path')
        ->assertUnprocessable()
        ->assertJsonValidationErrorFor('sort');
});

test('file detail and rename return safe metadata without changing storage coordinates', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/immutable.png",
    ]);

    $this->withToken($this->ownerToken)->getJson("/api/v1/files/{$file->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $file->id)
        ->assertJsonMissingPath('data.disk')
        ->assertJsonMissingPath('data.path');

    $this->withToken($this->ownerToken)->putJson("/api/v1/files/{$file->id}", [
        'display_name' => 'Renamed image',
    ])->assertOk()->assertJsonPath('data.display_name', 'Renamed image');

    $this->withToken($this->ownerToken)->putJson("/api/v1/files/{$file->id}", [
        'display_name' => 'Blocked overwrite',
        'disk' => 'public',
        'path' => 'outside',
        'owner_user_id' => 999,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['disk', 'path', 'owner_user_id']);

    expect($file->fresh())
        ->display_name->toBe('Renamed image')
        ->disk->toBe('managed-files')
        ->path->toBe("users/{$this->owner->id}/immutable.png")
        ->owner_user_id->toBe($this->owner->id);
});

test('content redirects to five minute urls with safe category dispositions', function (): void {
    CarbonImmutable::setTestNow('2026-09-04 12:00:00+00');
    $captured = [];
    Storage::disk('managed-files')->buildTemporaryUrlsUsing(
        function (string $path, DateTimeInterface $expires, array $options) use (&$captured): string {
            $captured[] = compact('path', 'expires', 'options');

            return 'https://signed.test/object/'.count($captured);
        },
    );
    $document = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/document.docx",
        'display_name' => "../Báo cáo\r\n.docx",
        'extension' => 'docx',
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    $image = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/image.png",
        'display_name' => 'Ảnh đại diện.png',
    ]);

    $documentResponse = $this->withToken($this->ownerToken)->get("/api/v1/files/{$document->id}/content")
        ->assertRedirect('https://signed.test/object/1');
    $imageResponse = $this->withToken($this->ownerToken)->get("/api/v1/files/{$image->id}/content")
        ->assertRedirect('https://signed.test/object/2');
    $downloadResponse = $this->withToken($this->ownerToken)->get("/api/v1/files/{$image->id}/content?download=1")
        ->assertRedirect('https://signed.test/object/3');

    expect($captured[0]['path'])->toBe($document->path)
        ->and($captured[0]['expires']->getTimestamp())->toBe(now()->addMinutes(5)->getTimestamp())
        ->and($captured[0]['options']['ResponseContentDisposition'])->toStartWith('attachment;')
        ->not->toContain('../', "\r", "\n")
        ->and($captured[1]['options']['ResponseContentDisposition'])->toStartWith('inline;')
        ->and($captured[2]['options']['ResponseContentDisposition'])->toStartWith('attachment;')
        ->and($documentResponse->headers->get('Cache-Control'))->toContain('no-store')
        ->and($imageResponse->headers->get('Cache-Control'))->toContain('no-store')
        ->and($downloadResponse->headers->get('Cache-Control'))->toContain('no-store');

    CarbonImmutable::setTestNow();
});

test('temporary url failures become FILE-003 and log only storage identifiers', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'managed-files',
        'path' => "users/{$this->owner->id}/failed.png",
    ]);
    Storage::disk('managed-files')->buildTemporaryUrlsUsing(
        fn () => throw UnableToGenerateTemporaryUrl::noGeneratorConfigured('secret-path'),
    );
    Log::shouldReceive('warning')->once()->with('Managed file temporary URL generation failed.', [
        'file_id' => $file->id,
        'owner_id' => $this->owner->id,
        'disk' => 'managed-files',
    ]);

    $result = app(GetFileContentAction::class)->handle(
        actor: $this->owner,
        fileId: $file->id,
        download: false,
    );

    expect($result->getError())->toBe(FileError::StorageUnavailable);
});

test('missing storage configuration becomes FILE-003 without exposing object coordinates', function (): void {
    $file = ManagedFile::factory()->for($this->owner, 'owner')->create([
        'disk' => 'missing-managed-disk',
        'path' => "users/{$this->owner->id}/private.png",
    ]);
    Log::shouldReceive('warning')->once()->with('Managed file temporary URL generation failed.', [
        'file_id' => $file->id,
        'owner_id' => $this->owner->id,
        'disk' => 'missing-managed-disk',
    ]);

    $result = app(GetFileContentAction::class)->handle(
        actor: $this->owner,
        fileId: $file->id,
        download: false,
    );

    expect($result->getError())->toBe(FileError::StorageUnavailable);
});

test('file list eager loads resource relations with a bounded query count', function (): void {
    $files = ManagedFile::factory()->count(6)->for($this->owner, 'owner')->create();
    foreach ($files as $file) {
        FileLink::factory()->for($file, 'file')->create();
    }

    DB::flushQueryLog();
    DB::enableQueryLog();
    $this->withToken($this->ownerToken)->getJson('/api/v1/files?per_page=20')->assertOk();

    expect(count(DB::getQueryLog()))->toBeGreaterThan(0)->toBeLessThanOrEqual(10);
    DB::disableQueryLog();
});
