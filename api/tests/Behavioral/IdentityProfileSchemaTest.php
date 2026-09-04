<?php

use App\Modules\Academic\Models\Subject;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentGuardian;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('a profile may exist without a login account', function () {
    $profile = Profile::factory()->create();

    expect($profile->user_id)->toBeNull()
        ->and($profile->metadata)->toBe([]);
});

test('a profile has nullable avatar configuration', function () {
    $profile = Profile::factory()->create();

    expect(Schema::hasColumn('profiles', 'avatar_config'))->toBeTrue()
        ->and($profile->fresh()->avatar_config)->toBeNull();
});

test('the profile backfill is idempotent', function () {
    $user = User::factory()->create(['username' => 'missing-profile']);
    $migration = require database_path('migrations/2026_09_04_000005_backfill_missing_user_profiles.php');

    $migration->up();
    $migration->up();

    expect(Profile::query()->where('user_id', $user->id)->count())->toBe(1)
        ->and($user->profile()->value('full_name'))->toBe('missing-profile');
});

test('the seeded administrator has exactly one profile', function () {
    $this->seed();
    $this->seed();

    $user = User::query()->where('username', 'admin@admin.com')->firstOrFail();

    expect($user->profile)->not->toBeNull()
        ->and(Profile::query()->where('user_id', $user->id)->count())->toBe(1);
});

test('a profile resolves its avatar through the profile-avatar file link', function () {
    $profile = Profile::factory()->create();
    $file = ManagedFile::factory()->create();

    FileLink::factory()->for($file, 'file')->create([
        'type' => FileLinkType::ProfileAvatar,
        'foreign_id' => $profile->id,
    ]);

    expect($profile->avatarFileLink->file->is($file))->toBeTrue();
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
