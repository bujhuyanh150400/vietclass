<?php

use App\Modules\Academic\Enums\AcademicFeature;
use App\Modules\Academic\Http\Controllers\ClassController;
use App\Modules\Academic\Http\Controllers\EnrollmentController;
use App\Modules\Academic\Http\Controllers\SubjectController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('subjects')->name('subjects.')->group(function (): void {
        Route::get('/', [SubjectController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::SubjectList))
            ->name('index');

        Route::get('options', [SubjectController::class, 'options'])
            ->middleware(Authorize::using(AcademicFeature::SubjectList))
            ->name('options');

        Route::post('/', [SubjectController::class, 'store'])
            ->middleware(Authorize::using(AcademicFeature::SubjectCreate))
            ->name('store');

        Route::get('{subject}', [SubjectController::class, 'show'])
            ->whereNumber('subject')
            ->middleware(Authorize::using(AcademicFeature::SubjectView))
            ->name('show');

        Route::put('{subject}', [SubjectController::class, 'update'])
            ->whereNumber('subject')
            ->middleware(Authorize::using(AcademicFeature::SubjectUpdate))
            ->name('update');

        Route::patch('{subject}/active', [SubjectController::class, 'toggleActive'])
            ->whereNumber('subject')
            ->middleware(Authorize::using(AcademicFeature::SubjectToggleActive))
            ->name('toggle-active');

        Route::delete('{subject}', [SubjectController::class, 'destroy'])
            ->whereNumber('subject')
            ->middleware(Authorize::using(AcademicFeature::SubjectDelete))
            ->name('destroy');
    });

    Route::prefix('classes')->name('classes.')->group(function (): void {
        Route::get('/', [ClassController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::ClassList))
            ->name('index');

        Route::get('options', [ClassController::class, 'options'])
            ->middleware(Authorize::using(AcademicFeature::ClassList))
            ->name('options');

        Route::post('/', [ClassController::class, 'store'])
            ->middleware(Authorize::using(AcademicFeature::ClassCreate))
            ->name('store');

        Route::get('{class}', [ClassController::class, 'show'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassView))
            ->name('show');

        Route::put('{class}', [ClassController::class, 'update'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassUpdate))
            ->name('update');

        Route::patch('{class}/status', [ClassController::class, 'changeStatus'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassChangeStatus))
            ->name('change-status');

        Route::get('{class}/enrollments', [EnrollmentController::class, 'index'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassView))
            ->name('enrollments.index');

        Route::get('{class}/available-students', [EnrollmentController::class, 'available'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassAddStudent))
            ->name('enrollments.available');

        Route::post('{class}/enrollments', [EnrollmentController::class, 'store'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassAddStudent))
            ->name('enrollments.store');
    });

    Route::prefix('enrollments')->name('enrollments.')->group(function (): void {
        Route::put('{enrollment}', [EnrollmentController::class, 'update'])
            ->whereNumber('enrollment')
            ->middleware(Authorize::using(AcademicFeature::ClassUpdateStudentEnrollment))
            ->name('update');

        Route::post('{enrollment}/transfer', [EnrollmentController::class, 'transfer'])
            ->whereNumber('enrollment')
            ->middleware(Authorize::using(AcademicFeature::ClassTransferStudent))
            ->name('transfer');

        Route::post('{enrollment}/leave', [EnrollmentController::class, 'leave'])
            ->whereNumber('enrollment')
            ->middleware(Authorize::using(AcademicFeature::ClassRemoveStudent))
            ->name('leave');
    });
});
