<?php

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\TeacherProfile;
use Illuminate\Database\QueryException;

test('every academic factory persists a usable record', function () {
    $enrollment = ClassEnrollment::factory()->create();

    $this->assertDatabaseCount('subjects', 1);
    $this->assertDatabaseCount('teacher_profiles', 1);
    $this->assertDatabaseCount('classes', 1);
    $this->assertDatabaseCount('student_profiles', 1);
    $this->assertDatabaseCount('class_enrollments', 1);

    expect($enrollment->schoolClass)->toBeInstanceOf(SchoolClass::class)
        ->and($enrollment->student)->toBeInstanceOf(StudentProfile::class)
        ->and($enrollment->schoolClass->subject)->toBeInstanceOf(Subject::class)
        ->and($enrollment->schoolClass->teacher)->toBeInstanceOf(TeacherProfile::class);
});

test('the class model maps to the conventionally named table', function () {
    expect((new SchoolClass)->getTable())->toBe('classes');
});

test('the class enums are cast in both directions', function () {
    $class = SchoolClass::factory()->create([
        'grade_level' => GradeLevel::Grade9,
        'status' => ClassStatus::Ended,
    ]);

    expect($class->fresh()->grade_level)->toBe(GradeLevel::Grade9)
        ->and($class->fresh()->status)->toBe(ClassStatus::Ended);

    $this->assertDatabaseHas('classes', ['id' => $class->id, 'grade_level' => 9, 'status' => 1]);
});

test('database defaults match the values a new model starts with', function () {
    $class = new SchoolClass;
    $subject = new Subject;

    expect($class->status)->toBe(ClassStatus::Active)
        ->and($class->max_students)->toBe(0)
        ->and($subject->is_active)->toBeTrue();
});

test('a subject name cannot be reused', function () {
    Subject::factory()->create(['name' => 'Toán']);

    expect(fn () => Subject::factory()->create(['name' => 'Toán']))
        ->toThrow(QueryException::class);
});

test('a class code cannot be reused', function () {
    SchoolClass::factory()->create(['code' => 'TOAN-9A']);

    expect(fn () => SchoolClass::factory()->create(['code' => 'TOAN-9A']))
        ->toThrow(QueryException::class);
});

test('a subject still used by a class cannot be removed at the database level', function () {
    $class = SchoolClass::factory()->create();

    expect(fn () => Subject::query()->whereKey($class->subject_id)->delete())
        ->toThrow(QueryException::class);
});

test('a student may enrol in the same class again after leaving', function () {
    $enrollment = ClassEnrollment::factory()->left()->create();

    $returning = ClassEnrollment::factory()->create([
        'class_id' => $enrollment->class_id,
        'student_id' => $enrollment->student_id,
        'enrolled_at' => now()->toDateString(),
    ]);

    expect($returning->exists)->toBeTrue()
        ->and(ClassEnrollment::query()
            ->where('class_id', $enrollment->class_id)
            ->where('student_id', $enrollment->student_id)
            ->count())->toBe(2);
});

test('the active scope keeps only enrolments the student has not left', function () {
    $class = SchoolClass::factory()->create();

    $current = ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $leavingLater = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'left_at' => now()->addWeek()->toDateString(),
    ]);
    $leavingToday = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'left_at' => now()->toDateString(),
    ]);
    $gone = ClassEnrollment::factory()->left()->create(['class_id' => $class->id]);

    $active = ClassEnrollment::query()->where('class_id', $class->id)->active()->pluck('id');

    expect($active)->toContain($current->id, $leavingLater->id)
        ->and($active)->not->toContain($leavingToday->id)
        ->and($active)->not->toContain($gone->id);
});

test('the model and the query agree on what counts as active', function () {
    $class = SchoolClass::factory()->create();

    $current = ClassEnrollment::factory()->create(['class_id' => $class->id]);
    $leavingToday = ClassEnrollment::factory()->create([
        'class_id' => $class->id,
        'left_at' => now()->toDateString(),
    ]);

    expect($current->isActive())->toBeTrue()
        ->and($leavingToday->isActive())->toBeFalse();
});
