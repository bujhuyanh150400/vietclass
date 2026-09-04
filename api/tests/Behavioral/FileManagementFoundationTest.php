<?php

use App\Core\Contracts\ErrorDeclarationEnum;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Rules\ManagedFileUpload;
use App\Modules\FileManagement\Support\FileTypeMap;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

test('file errors expose stable declarations and HTTP statuses', function (): void {
    expect(FileError::NotFound)
        ->toBeInstanceOf(ErrorDeclarationEnum::class)
        ->and(FileError::NotFound->value)->toBe('FILE-001')
        ->and(FileError::NotFound->httpStatus())->toBe(404)
        ->and(FileError::QuotaExceeded->value)->toBe('FILE-002')
        ->and(FileError::QuotaExceeded->httpStatus())->toBe(409)
        ->and(FileError::StorageUnavailable->value)->toBe('FILE-003')
        ->and(FileError::StorageUnavailable->httpStatus())->toBe(503)
        ->and(FileError::Linked->value)->toBe('FILE-004')
        ->and(FileError::Linked->httpStatus())->toBe(409)
        ->and(FileError::LifecycleConflict->value)->toBe('FILE-005')
        ->and(FileError::LifecycleConflict->httpStatus())->toBe(409);
});

test('the type map accepts only matching normalized extension and MIME pairs', function (): void {
    expect(FileTypeMap::resolve('JPG', 'image/jpeg'))
        ->toBe(['category' => 'image', 'extension' => 'jpg', 'mime_type' => 'image/jpeg'])
        ->and(FileTypeMap::resolve('jpg', 'text/html'))->toBeNull()
        ->and(FileTypeMap::resolve('svg', 'image/svg+xml'))->toBeNull();
});

test('an html payload renamed to jpg is rejected', function (): void {
    $file = UploadedFile::fake()->createWithContent('avatar.jpg', '<html>unsafe</html>');
    $validator = Validator::make(['file' => $file], ['file' => [new ManagedFileUpload]]);

    expect($validator->fails())->toBeTrue();
});
