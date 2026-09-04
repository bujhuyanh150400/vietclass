<?php

use App\Modules\FileManagement\Enums\FileManagementFeature;
use App\Modules\FileManagement\Http\Controllers\FileController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('files')->name('files.')->group(function (): void {
    Route::get('owner-options', [FileController::class, 'ownerOptions'])
        ->middleware(Authorize::using(FileManagementFeature::List))
        ->name('owner-options');

    Route::get('usage', [FileController::class, 'usage'])
        ->middleware(Authorize::using(FileManagementFeature::List))
        ->name('usage');

    Route::get('/', [FileController::class, 'index'])
        ->middleware(Authorize::using(FileManagementFeature::List))
        ->name('index');

    Route::post('/', [FileController::class, 'store'])
        ->middleware(Authorize::using(FileManagementFeature::Upload))
        ->name('store');

    Route::post('{file}/restore', [FileController::class, 'restore'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::Update))
        ->name('restore');

    Route::delete('{file}/permanent', [FileController::class, 'permanent'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::Delete))
        ->name('permanent');

    Route::get('{file}', [FileController::class, 'show'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::List))
        ->name('show');

    Route::put('{file}', [FileController::class, 'update'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::Update))
        ->name('update');

    Route::delete('{file}', [FileController::class, 'destroy'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::Delete))
        ->name('destroy');

    Route::get('{file}/content', [FileController::class, 'content'])
        ->whereNumber('file')
        ->middleware(Authorize::using(FileManagementFeature::List))
        ->name('content');
});
