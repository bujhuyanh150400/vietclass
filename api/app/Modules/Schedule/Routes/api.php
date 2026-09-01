<?php

use App\Modules\Schedule\Enums\ScheduleFeature;
use App\Modules\Schedule\Http\Controllers\ScheduleSessionController;
use App\Modules\Schedule\Http\Controllers\ScheduleTemplateController;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // Reading and opening a fixed schedule are addressed through the class they belong
    // to, because a weekly slot has no meaning apart from one class. Every other
    // operation addresses the schedule itself.
    Route::prefix('classes')->name('classes.')->group(function (): void {
        Route::get('{class}/schedule-templates', [ScheduleTemplateController::class, 'index'])
            ->whereNumber('class')
            ->middleware(Authorize::using(ScheduleFeature::TemplateList))
            ->name('schedule-templates.index');

        Route::post('{class}/schedule-templates', [ScheduleTemplateController::class, 'store'])
            ->whereNumber('class')
            ->middleware(Authorize::using(ScheduleFeature::TemplateCreate))
            ->name('schedule-templates.store');
    });

    Route::prefix('schedule-templates')->name('schedule-templates.')->group(function (): void {
        // The update path is a revision: it closes the running version and opens a new
        // one, so it is never an in-place edit of the row addressed here.
        Route::put('{template}', [ScheduleTemplateController::class, 'update'])
            ->whereNumber('template')
            ->middleware(Authorize::using(ScheduleFeature::TemplateUpdate))
            ->name('update');

        Route::put('{template}/teachers', [ScheduleTemplateController::class, 'setTeachers'])
            ->whereNumber('template')
            ->middleware(Authorize::using(ScheduleFeature::TemplateUpdate))
            ->name('teachers');

        Route::patch('{template}/close', [ScheduleTemplateController::class, 'close'])
            ->whereNumber('template')
            ->middleware(Authorize::using(ScheduleFeature::TemplateUpdate))
            ->name('close');

        Route::delete('{template}', [ScheduleTemplateController::class, 'destroy'])
            ->whereNumber('template')
            ->middleware(Authorize::using(ScheduleFeature::TemplateDelete))
            ->name('destroy');
    });

    // A session is addressed on its own rather than through its class: the calendar read
    // spans classes, and a session may belong to none once make-up and extra lessons
    // arrive.
    Route::prefix('schedule-sessions')->name('schedule-sessions.')->group(function (): void {
        Route::get('/', [ScheduleSessionController::class, 'index'])
            ->middleware(Authorize::using(ScheduleFeature::SessionList))
            ->name('index');

        // Declared before the identifier route on purpose. A projected session has no
        // identifier, so materialising it cannot be addressed as one, and this literal
        // path would otherwise be read as an identifier by whichever route matched first.
        Route::post('resolve', [ScheduleSessionController::class, 'resolve'])
            ->middleware(Authorize::using(ScheduleFeature::SessionManage))
            ->name('resolve');

        Route::get('{instance}', [ScheduleSessionController::class, 'show'])
            ->whereNumber('instance')
            ->middleware(Authorize::using(ScheduleFeature::SessionView))
            ->name('show');
    });
});
