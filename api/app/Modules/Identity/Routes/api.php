<?php

use App\Modules\Identity\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:identity-login')
        ->name('auth.login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('me', [AuthController::class, 'me'])->name('auth.me');
        Route::delete('logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});
