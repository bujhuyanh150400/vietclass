<?php

use App\Modules\Identity\Enums\IdentityFeature;
use App\Modules\Identity\Http\Controllers\StudentController;
use App\Modules\Identity\Http\Controllers\TeacherController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('teachers')->name('teachers.')->group(function (): void {
        Route::get('/', [TeacherController::class, 'index'])
            ->middleware(Authorize::using(IdentityFeature::TeacherList))
            ->name('index');

        Route::get('options', [TeacherController::class, 'options'])
            ->middleware(Authorize::using(IdentityFeature::TeacherList))
            ->name('options');

        Route::post('/', [TeacherController::class, 'store'])
            ->middleware(Authorize::using(IdentityFeature::TeacherCreate))
            ->name('store');

        Route::get('{teacher}', [TeacherController::class, 'show'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(IdentityFeature::TeacherView))
            ->name('show');

        Route::put('{teacher}', [TeacherController::class, 'update'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(IdentityFeature::TeacherUpdate))
            ->name('update');

        Route::patch('{teacher}/account', [TeacherController::class, 'toggleAccount'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(IdentityFeature::TeacherToggleActive))
            ->name('toggle-account');

        Route::patch('{teacher}/password', [TeacherController::class, 'changePassword'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(IdentityFeature::TeacherUpdate))
            ->name('change-password');
    });

    Route::prefix('students')->name('students.')->group(function (): void {
        Route::get('/', [StudentController::class, 'index'])
            ->middleware(Authorize::using(IdentityFeature::StudentList))
            ->name('index');

        Route::post('/', [StudentController::class, 'store'])
            ->middleware(Authorize::using(IdentityFeature::StudentCreate))
            ->name('store');

        Route::get('{student}', [StudentController::class, 'show'])
            ->whereNumber('student')
            ->middleware(Authorize::using(IdentityFeature::StudentView))
            ->name('show');

        Route::put('{student}', [StudentController::class, 'update'])
            ->whereNumber('student')
            ->middleware(Authorize::using(IdentityFeature::StudentUpdate))
            ->name('update');

        Route::patch('{student}/account', [StudentController::class, 'toggleAccount'])
            ->whereNumber('student')
            ->middleware(Authorize::using(IdentityFeature::StudentToggleActive))
            ->name('toggle-account');

        Route::patch('{student}/password', [StudentController::class, 'changePassword'])
            ->whereNumber('student')
            ->middleware(Authorize::using(IdentityFeature::StudentUpdate))
            ->name('change-password');
    });
});
