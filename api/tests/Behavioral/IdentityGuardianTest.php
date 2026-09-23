<?php

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;

function phase3StudentPayload(array $overrides = []): array
{
    return [
        'username' => 'hs_'.fake()->unique()->numerify('######'),
        'password' => 'matkhau123',
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        ...$overrides,
    ];
}

function existingGuardianForStudent(int $studentId, string $name = 'Phạm Văn D'): Profile
{
    $guardian = Profile::factory()->create(['full_name' => $name, 'phone' => '0912345678']);
    $guardian->guardianLinks()->create([
        'student_profile_id' => $studentId,
        'relationship' => GuardianRelationship::Father,
        'is_primary' => false,
    ]);

    return $guardian;
}

beforeEach(function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($admin->createToken('test')->plainTextToken);
});

test('student roster only links an existing role-pure guardian and never auto-promotes', function () {
    $linkedStudent = StudentProfile::factory()->create();
    $guardian = existingGuardianForStudent($linkedStudent->profile_id);
    $profileCount = Profile::query()->count();

    $this->postJson('/api/v1/academic/students', phase3StudentPayload([
        'guardians' => [[
            'guardian_profile_id' => $guardian->id,
            'relationship' => GuardianRelationship::Mother->value,
            'is_primary' => true,
        ]],
    ]))->assertCreated();

    expect(Profile::query()->count())->toBe($profileCount + 1);

    $this->postJson('/api/v1/academic/students', phase3StudentPayload([
        'guardians' => [[
            'guardian_profile_id' => $guardian->id,
            'relationship' => GuardianRelationship::Mother->value,
        ]],
    ]))->assertJsonValidationErrorFor('guardians.0.is_primary');
});

test('student roster rejects typed profile data and profiles with another role', function () {
    $student = StudentProfile::factory()->create();
    $typed = $this->postJson('/api/v1/academic/students', phase3StudentPayload([
        'guardians' => [[
            'name' => 'Không tạo mới',
            'gender' => Gender::Male->value,
            'relationship' => GuardianRelationship::Father->value,
            'is_primary' => true,
        ]],
    ]));
    $typed->assertJsonValidationErrorFor('guardians.0.guardian_profile_id');

    $this->postJson('/api/v1/academic/students', phase3StudentPayload([
        'guardians' => [[
            'guardian_profile_id' => $student->profile_id,
            'relationship' => GuardianRelationship::Father->value,
            'is_primary' => true,
        ]],
    ]))->assertNotFound();
});

test('student roster allows an explicitly empty roster to remove the final guardian', function () {
    $student = StudentProfile::factory()->create();
    $guardian = existingGuardianForStudent($student->profile_id);
    $student->guardianLinks()->where('guardian_profile_id', $guardian->id)->update(['is_primary' => true]);

    $this->putJson('/api/v1/academic/students/'.$student->profile_id, [
        'full_name' => $student->profile->full_name,
        'gender' => $student->profile->gender->value,
        'grade_level' => $student->grade_level->value,
        'status' => $student->status->value,
        'guardians' => [],
    ])->assertOk();

    expect($student->guardianLinks()->count())->toBe(0);
});

test('student roster requires an explicit replacement when removing a primary link', function () {
    $student = StudentProfile::factory()->create();
    $primary = existingGuardianForStudent($student->profile_id, 'Primary');
    $replacement = existingGuardianForStudent($student->profile_id, 'Replacement');
    $student->guardianLinks()->where('guardian_profile_id', $primary->id)->update(['is_primary' => true]);

    $this->putJson('/api/v1/academic/students/'.$student->profile_id, [
        'full_name' => $student->profile->full_name,
        'gender' => $student->profile->gender->value,
        'grade_level' => $student->grade_level->value,
        'status' => $student->status->value,
        'guardians' => [[
            'guardian_profile_id' => $replacement->id,
            'relationship' => GuardianRelationship::Mother->value,
            'is_primary' => true,
        ]],
    ])->assertOk();

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => $replacement->id,
        'is_primary' => true,
    ]);
});
