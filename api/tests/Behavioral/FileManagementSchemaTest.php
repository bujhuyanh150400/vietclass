<?php

use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\Schema;

test('file persistence has only the approved columns and indexes', function () {
    expect(Schema::hasColumns('files', [
        'id', 'owner_user_id', 'original_name', 'display_name', 'disk', 'path',
        'extension', 'mime_type', 'size_bytes', 'deleted_at', 'created_at', 'updated_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumn('files', 'folder_id'))->toBeFalse()
        ->and(Schema::hasColumn('files', 'uploaded_by_user_id'))->toBeFalse();
});

test('file links provide the only generic usage reference', function () {
    expect(Schema::hasColumns('file_links', [
        'id', 'file_id', 'type', 'foreign_id', 'created_at', 'updated_at',
    ]))->toBeTrue()
        ->and(Schema::hasColumn('file_links', 'owner_user_id'))->toBeFalse()
        ->and(Schema::hasColumn('file_links', 'folder_id'))->toBeFalse();
});

test('system settings provide mutable system configuration', function () {
    expect(Schema::hasColumns('system_settings', [
        'id', 'key', 'value', 'description', 'updated_by', 'created_at', 'updated_at',
    ]))->toBeTrue();
});

test('a file belongs to its immutable owner and exposes its usage links', function () {
    $file = ManagedFile::factory()->for(User::factory(), 'owner')->create();

    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => Profile::factory()->create()->id,
    ]);

    expect($file->owner)->toBeInstanceOf(User::class)
        ->and($file->links)->toHaveCount(1)
        ->and($file->links->sole()->type)->toBe(FileLinkType::ProfileAvatar);
});
