<?php

use App\Modules\Academic\Http\Resources\StudentResource;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Models\Subject;

it('reports the name and details for active enrollments only', function () {
    $student = StudentProfile::factory()->create();
    $subject = Subject::factory()->create(['name' => 'Toán']);
    $schoolClass = SchoolClass::factory()->create([
        'name' => 'Lớp Toán 9A',
        'code' => 'TOAN9-A',
        'subject_id' => $subject->id,
    ]);
    $leftClass = SchoolClass::factory()->create([
        'name' => 'Lớp Anh 9B',
        'code' => 'ANH9-B',
    ]);

    ClassEnrollment::factory()->create([
        'class_id' => $schoolClass->id,
        'student_id' => $student->profile_id,
    ]);
    ClassEnrollment::factory()->left()->create([
        'class_id' => $leftClass->id,
        'student_id' => $student->profile_id,
    ]);

    $student->load([
        'profile.user',
        'primaryGuardian.guardian',
        'guardianLinks.guardian',
        'activeEnrollments.schoolClass.primarySubject',
    ]);

    expect((new StudentResource($student))->resolve(request()))
        ->toMatchArray([
            'active_enrollments' => [[
                'class_id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'code' => $schoolClass->code,
                'subject_name' => $subject->name,
            ]],
        ]);
});
