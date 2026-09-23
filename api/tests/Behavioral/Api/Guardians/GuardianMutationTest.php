<?php

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use Illuminate\Support\Facades\DB;

function guardianPayload(array $students, array $overrides = []): array
{
    return [
        'full_name' => 'Phạm Văn Guardian',
        'phone' => '0900000001',
        'email' => null,
        'gender' => Gender::Male->value,
        'address' => null,
        'note' => null,
        'students' => $students,
        ...$overrides,
    ];
}

function mutationStudent(string $name = 'Lê Minh An'): StudentProfile
{
    return StudentProfile::factory()->create([
        'profile_id' => Profile::factory()->create(['full_name' => $name])->id,
    ]);
}

function mutationAdmin(): void
{
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    test()->withToken($admin->createToken('test')->plainTextToken);
}

test('admin creates a role-pure guardian with a complete linked student roster', function () {
    $first = mutationStudent('Lê Minh An');
    $second = mutationStudent('Trần Minh Bình');
    mutationAdmin();

    $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $first->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
        ['student_profile_id' => $second->profile_id, 'relationship' => GuardianRelationship::Guardian->value, 'is_primary' => false],
    ]))
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Phạm Văn Guardian')
        ->assertJsonCount(2, 'data.students');

    $guardian = Profile::query()->where('full_name', 'Phạm Văn Guardian')->firstOrFail();
    expect($guardian->user_id)->toBeNull()
        ->and($guardian->teacherProfile()->exists())->toBeFalse()
        ->and($guardian->studentProfile()->exists())->toBeFalse();
});

test('same guardian name with a different phone creates a separate profile', function () {
    $student = mutationStudent();
    mutationAdmin();

    $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
    ]))->assertCreated();

    $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Mother->value, 'is_primary' => false],
    ], ['phone' => '0900000002']))->assertCreated();

    expect(Profile::query()->where('full_name', 'Phạm Văn Guardian')->count())->toBe(2);
});

test('exact guardian name and phone duplicate returns 409 without writes', function () {
    $student = mutationStudent();
    mutationAdmin();
    $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
    ]))->assertCreated();
    $profileCount = Profile::query()->count();
    $linkCount = DB::table('student_guardians')->count();

    $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
    ]))
        ->assertStatus(409)
        ->assertJsonPath('meta.existing_guardian_name', 'Phạm Văn Guardian');

    expect(Profile::query()->count())->toBe($profileCount)
        ->and(DB::table('student_guardians')->count())->toBe($linkCount);
});

test('guardian mutation rejects a profile carrying a student role', function () {
    $student = mutationStudent();
    mutationAdmin();

    $this->putJson('/api/v1/academic/guardians/'.$student->profile_id, guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
    ]))->assertNotFound();
});

test('updating or deleting a primary guardian requires an explicit valid replacement', function () {
    $student = mutationStudent();
    $replacement = Profile::factory()->create(['full_name' => 'Replacement']);
    mutationAdmin();
    $guardianResponse = $this->postJson('/api/v1/academic/guardians', guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => true],
    ]))->assertCreated();
    $guardianId = $guardianResponse->json('data.id');
    $replacement->guardianLinks()->create([
        'student_profile_id' => $student->profile_id,
        'relationship' => GuardianRelationship::Mother,
        'is_primary' => false,
    ]);

    $this->putJson("/api/v1/academic/guardians/{$guardianId}", guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => false],
    ]))->assertStatus(422);

    $this->assertDatabaseHas('profiles', ['id' => $guardianId, 'full_name' => 'Phạm Văn Guardian']);
    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => $guardianId,
        'is_primary' => true,
    ]);

    $this->putJson("/api/v1/academic/guardians/{$guardianId}", guardianPayload([
        ['student_profile_id' => $student->profile_id, 'relationship' => GuardianRelationship::Father->value, 'is_primary' => false],
    ], ['replacements' => [$student->profile_id => $replacement->id]]))
        ->assertOk();

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => $replacement->id,
        'is_primary' => true,
    ]);

    $this->deleteJson("/api/v1/academic/guardians/{$guardianId}", [
        'replacements' => [$student->profile_id => $replacement->id],
    ])->assertNoContent();

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $student->profile_id,
        'guardian_profile_id' => $replacement->id,
        'is_primary' => true,
    ]);
});
