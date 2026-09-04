<?php

use App\Modules\System\Enums\SystemFeature;
use App\Modules\System\Http\Controllers\FileQuotaController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('system')->name('system.')->group(function (): void {
    Route::get('file-quotas', [FileQuotaController::class, 'show'])
        ->middleware(Authorize::using(SystemFeature::FileQuotaManage))
        ->name('file-quotas.show');

    Route::put('file-quotas', [FileQuotaController::class, 'update'])
        ->middleware(Authorize::using(SystemFeature::FileQuotaManage))
        ->name('file-quotas.update');
});
