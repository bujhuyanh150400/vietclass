<?php

use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;

it('stores legacy primary IDs as normalized subject and teacher assignments', function () {
    $subject = Subject::factory()->create();
    $teacher = TeacherProfile::factory()->create();

    $class = SchoolClass::factory()->create([
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->profile_id,
    ]);

    expect($class->fresh()->subject_id)->toBe($subject->id)
        ->and($class->fresh()->teacher_id)->toBe($teacher->profile_id)
        ->and($class->subjects()->wherePivot('is_primary', true)->sole()->id)->toBe($subject->id)
        ->and($class->teachers()->wherePivot('is_primary', true)->sole()->profile_id)->toBe($teacher->profile_id);
});

it('creates exactly one primary subject and lead for factory defaults', function () {
    $class = SchoolClass::factory()->create();

    expect($class->subjects()->wherePivot('is_primary', true)->count())->toBe(1)
        ->and($class->teachers()->wherePivot('is_primary', true)->count())->toBe(1)
        ->and($class->subject_id)->toBe($class->subjects()->wherePivot('is_primary', true)->value('subjects.id'))
        ->and($class->teacher_id)->toBe($class->teachers()->wherePivot('is_primary', true)->value('teacher_profiles.profile_id'));
});
