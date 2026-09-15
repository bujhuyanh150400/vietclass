<?php

use App\Modules\System\Enums\SystemFeature;
use App\Modules\System\Http\Controllers\FileController;
use App\Modules\System\Http\Controllers\FileQuotaController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('system')->name('system.')->group(function (): void {
    Route::prefix('files')->name('files.')->group(function (): void {
        Route::get('owner-options', [FileController::class, 'ownerOptions'])
            ->middleware(Authorize::using(SystemFeature::FileList))
            ->name('owner-options');

        Route::get('usage', [FileController::class, 'usage'])
            ->middleware(Authorize::using(SystemFeature::FileList))
            ->name('usage');

        Route::get('/', [FileController::class, 'index'])
            ->middleware(Authorize::using(SystemFeature::FileList))
            ->name('index');

        Route::post('/', [FileController::class, 'store'])
            ->middleware(Authorize::using(SystemFeature::FileUpload))
            ->name('store');

        Route::post('{file}/restore', [FileController::class, 'restore'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileUpdate))
            ->name('restore');

        Route::delete('{file}/permanent', [FileController::class, 'permanent'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileDelete))
            ->name('permanent');

        Route::get('{file}', [FileController::class, 'show'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileList))
            ->name('show');

        Route::put('{file}', [FileController::class, 'update'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileUpdate))
            ->name('update');

        Route::delete('{file}', [FileController::class, 'destroy'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileDelete))
            ->name('destroy');

        Route::get('{file}/content', [FileController::class, 'content'])
            ->whereNumber('file')
            ->middleware(Authorize::using(SystemFeature::FileList))
            ->name('content');
    });

    Route::prefix('settings')->name('settings.')->group(function (): void {
        Route::get('file-quotas', [FileQuotaController::class, 'show'])
            ->middleware(Authorize::using(SystemFeature::FileQuotaManage))
            ->name('file-quotas.show');

        Route::put('file-quotas', [FileQuotaController::class, 'update'])
            ->middleware(Authorize::using(SystemFeature::FileQuotaManage))
            ->name('file-quotas.update');
    });
});
