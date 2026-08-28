<?php

use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentGuardian;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

test('a profile may exist without a login account', function () {
    $profile = Profile::factory()->create();

    expect($profile->user_id)->toBeNull()
        ->and($profile->metadata)->toBe([]);
});

test('a class cannot be assigned to a profile that is not a teacher', function () {
    $student = StudentProfile::factory()->create();
    $subject = Subject::factory()->create();

    expect(fn () => DB::table('classes')->insert([
        'code' => 'TEST-01',
        'name' => 'Lớp thử',
        'subject_id' => $subject->id,
        'teacher_id' => $student->profile_id,
        'grade_level' => 9,
        'max_students' => 20,
        'status' => 0,
        'start_at' => now()->toDateString(),
        'created_at' => now(),
        'updated_at' => now(),
    ]))->toThrow(QueryException::class);
});

test('a student may have only one primary guardian', function () {
    $student = StudentProfile::factory()->create();

    StudentGuardian::query()->create([
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => Profile::factory()->create()->id,
        'relationship' => GuardianRelationship::Mother,
        'is_primary' => true,
    ]);

    expect(fn () => StudentGuardian::query()->create([
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => Profile::factory()->create()->id,
        'relationship' => GuardianRelationship::Father,
        'is_primary' => true,
    ]))->toThrow(QueryException::class);
});

test('a student may have a second guardian who is not the primary contact', function () {
    $student = StudentProfile::factory()->create();

    StudentGuardian::query()->create([
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => Profile::factory()->create()->id,
        'relationship' => GuardianRelationship::Mother,
        'is_primary' => true,
    ]);

    StudentGuardian::query()->create([
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => Profile::factory()->create()->id,
        'relationship' => GuardianRelationship::Father,
        'is_primary' => false,
    ]);

    expect($student->guardianLinks()->count())->toBe(2)
        ->and($student->primaryGuardian()->first()->relationship)
        ->toBe(GuardianRelationship::Mother);
});

test('one guardian profile may be shared by two siblings', function () {
    $guardian = Profile::factory()->create();
    $olderSibling = StudentProfile::factory()->create();
    $youngerSibling = StudentProfile::factory()->create();

    foreach ([$olderSibling, $youngerSibling] as $sibling) {
        StudentGuardian::query()->create([
            'student_profile_id' => $sibling->profile_id,
            'guardian_profile_id' => $guardian->id,
            'relationship' => GuardianRelationship::Father,
            'is_primary' => true,
        ]);
    }

    expect(StudentGuardian::query()->where('guardian_profile_id', $guardian->id)->count())->toBe(2);
});

test('deleting a student profile removes its guardian links but keeps the guardian', function () {
    $guardian = Profile::factory()->create();
    $student = StudentProfile::factory()->create();

    StudentGuardian::query()->create([
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => $guardian->id,
        'relationship' => GuardianRelationship::Other,
        'is_primary' => true,
    ]);

    $student->delete();

    $this->assertDatabaseMissing('student_guardians', ['guardian_profile_id' => $guardian->id]);
    $this->assertDatabaseHas('profiles', ['id' => $guardian->id]);
});
