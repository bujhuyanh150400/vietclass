<?php

use App\Modules\Academic\Enums\AcademicFeature;
use App\Modules\Academic\Http\Controllers\ClassController;
use App\Modules\Academic\Http\Controllers\EnrollmentController;
use App\Modules\Academic\Http\Controllers\GuardianController;
use App\Modules\Academic\Http\Controllers\ProfileAvatarController;
use App\Modules\Academic\Http\Controllers\RoomController;
use App\Modules\Academic\Http\Controllers\StudentController;
use App\Modules\Academic\Http\Controllers\SubjectController;
use App\Modules\Academic\Http\Controllers\TeacherController;
use App\Modules\Academic\Http\Middleware\RejectTeacherGuardianMutation;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('academic')->name('academic.')->group(function (): void {
    Route::put('profiles/{profile}/avatar', ProfileAvatarController::class)
        ->whereNumber('profile')
        ->middleware(Authorize::using(AcademicFeature::ProfileAvatarUpdate))
        ->name('profiles.avatar.update');

    Route::prefix('teachers')->name('teachers.')->group(function (): void {
        Route::get('/', [TeacherController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::TeacherList))
            ->name('index');

        Route::get('options', [TeacherController::class, 'options'])
            ->middleware(Authorize::using(AcademicFeature::TeacherList))
            ->name('options');

        Route::post('/', [TeacherController::class, 'store'])
            ->middleware(Authorize::using(AcademicFeature::TeacherCreate))
            ->name('store');

        Route::get('{teacher}', [TeacherController::class, 'show'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(AcademicFeature::TeacherView))
            ->name('show');

        Route::put('{teacher}', [TeacherController::class, 'update'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(AcademicFeature::TeacherUpdate))
            ->name('update');

        Route::patch('{teacher}/account', [TeacherController::class, 'toggleAccount'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(AcademicFeature::TeacherToggleActive))
            ->name('toggle-account');

        Route::patch('{teacher}/password', [TeacherController::class, 'changePassword'])
            ->whereNumber('teacher')
            ->middleware(Authorize::using(AcademicFeature::TeacherUpdate))
            ->name('change-password');
    });

    Route::prefix('guardians')->name('guardians.')->group(function (): void {
        Route::get('/', [GuardianController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::GuardianList))
            ->name('index');

        Route::get('options', [GuardianController::class, 'options'])
            ->middleware(RejectTeacherGuardianMutation::class)
            ->middleware(Authorize::using(AcademicFeature::StudentUpdate))
            ->name('options');

        Route::post('/', [GuardianController::class, 'store'])
            ->middleware(RejectTeacherGuardianMutation::class)
            ->middleware(Authorize::using(AcademicFeature::GuardianCreate))
            ->name('store');

        Route::get('{guardian}', [GuardianController::class, 'show'])
            ->whereNumber('guardian')
            ->middleware(Authorize::using(AcademicFeature::GuardianView))
            ->name('show');

        Route::put('{guardian}', [GuardianController::class, 'update'])
            ->whereNumber('guardian')
            ->middleware(RejectTeacherGuardianMutation::class)
            ->middleware(Authorize::using(AcademicFeature::GuardianUpdate))
            ->name('update');

        Route::delete('{guardian}', [GuardianController::class, 'destroy'])
            ->whereNumber('guardian')
            ->middleware(RejectTeacherGuardianMutation::class)
            ->middleware(Authorize::using(AcademicFeature::GuardianDelete))
            ->name('destroy');
    });

    Route::prefix('students')->name('students.')->group(function (): void {
        Route::get('/', [StudentController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::StudentList))
            ->name('index');

        Route::post('/', [StudentController::class, 'store'])
            ->middleware(Authorize::using(AcademicFeature::StudentCreate))
            ->name('store');

        Route::get('{student}', [StudentController::class, 'show'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentView))
            ->name('show');

        Route::get('{student}/classes', [StudentController::class, 'classes'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentView))
            ->name('classes');

        Route::get('{student}/enrollment-events', [StudentController::class, 'enrollmentHistory'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentView))
            ->name('enrollment-events');

        Route::put('{student}', [StudentController::class, 'update'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentUpdate))
            ->name('update');

        Route::patch('{student}/account', [StudentController::class, 'toggleAccount'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentToggleActive))
            ->name('toggle-account');

        Route::patch('{student}/password', [StudentController::class, 'changePassword'])
            ->whereNumber('student')
            ->middleware(Authorize::using(AcademicFeature::StudentUpdate))
            ->name('change-password');
    });

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

    Route::prefix('rooms')->name('rooms.')->group(function (): void {
        Route::get('/', [RoomController::class, 'index'])
            ->middleware(Authorize::using(AcademicFeature::RoomList))
            ->name('index');

        Route::get('options', [RoomController::class, 'options'])
            ->middleware(Authorize::using(AcademicFeature::RoomList))
            ->name('options');

        Route::post('/', [RoomController::class, 'store'])
            ->middleware(Authorize::using(AcademicFeature::RoomCreate))
            ->name('store');

        Route::get('{room}', [RoomController::class, 'show'])
            ->whereNumber('room')
            ->middleware(Authorize::using(AcademicFeature::RoomView))
            ->name('show');

        Route::put('{room}', [RoomController::class, 'update'])
            ->whereNumber('room')
            ->middleware(Authorize::using(AcademicFeature::RoomUpdate))
            ->name('update');

        Route::patch('{room}/status', [RoomController::class, 'changeStatus'])
            ->whereNumber('room')
            ->middleware(Authorize::using(AcademicFeature::RoomChangeStatus))
            ->name('change-status');

        Route::delete('{room}', [RoomController::class, 'destroy'])
            ->whereNumber('room')
            ->middleware(Authorize::using(AcademicFeature::RoomDelete))
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

        Route::get('{class}/enrollment-student-options', [EnrollmentController::class, 'studentOptions'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassAddStudent))
            ->name('enrollments.student-options');

        Route::post('{class}/enrollments', [EnrollmentController::class, 'store'])
            ->whereNumber('class')
            ->middleware(Authorize::using(AcademicFeature::ClassAddStudent))
            ->name('enrollments.store');
    });

    Route::prefix('enrollments')->name('enrollments.')->group(function (): void {
        Route::get('{enrollment}/transfer-options', [EnrollmentController::class, 'transferOptions'])
            ->whereNumber('enrollment')
            ->middleware(Authorize::using(AcademicFeature::ClassTransferStudent))
            ->name('transfer-options');

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
