<?php

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function guardianStudentPayload(array $overrides = []): array
{
    return [
        'username' => 'hs_linh',
        'password' => 'matkhau123',
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'guardian_name' => 'Phạm Văn D',
        'guardian_gender' => Gender::Male->value,
        'guardian_relationship' => GuardianRelationship::Father->value,
        'guardian_phone' => '0912345678',
        ...$overrides,
    ];
}

test('creating a student creates the guardian profile and links it as primary contact', function () {
    $this->postJson('/api/v1/students', guardianStudentPayload())
        ->assertCreated()
        ->assertJsonPath('data.guardian_name', 'Phạm Văn D')
        ->assertJsonPath('data.guardian_phone', '0912345678')
        ->assertJsonPath('data.guardian_relationship', GuardianRelationship::Father->value);

    $this->assertDatabaseHas('profiles', ['full_name' => 'Phạm Văn D', 'user_id' => null]);
    $this->assertDatabaseHas('student_guardians', ['is_primary' => true]);
});

test('two siblings entered with one phone number share a single guardian profile', function () {
    $this->postJson('/api/v1/students', guardianStudentPayload())->assertCreated();

    $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_minh',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
    ]))->assertCreated();

    expect(Profile::query()->where('full_name', 'Phạm Văn D')->count())->toBe(1);
    $this->assertDatabaseCount('student_guardians', 2);
});

test('a guardian entered without a phone number gets a profile of their own', function () {
    $this->postJson('/api/v1/students', guardianStudentPayload(['guardian_phone' => null]))
        ->assertCreated();

    $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_khac',
        'guardian_phone' => null,
    ]))->assertCreated();

    expect(Profile::query()->where('full_name', 'Phạm Văn D')->count())->toBe(2);
});

test('guardian name, gender and relationship are all required', function () {
    foreach (['guardian_name', 'guardian_gender', 'guardian_relationship'] as $field) {
        $this->postJson('/api/v1/students', guardianStudentPayload([$field => null]))
            ->assertJsonValidationErrorFor($field);
    }
});

test('updating a student rewrites the primary guardian in place', function () {
    $created = $this->postJson('/api/v1/students', guardianStudentPayload())->assertCreated();
    $studentId = $created->json('data.id');
    $guardianProfileId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');

    $this->putJson("/api/v1/students/{$studentId}", [
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'status' => 0,
        'guardian_name' => 'Phạm Thị E',
        'guardian_gender' => Gender::Female->value,
        'guardian_relationship' => GuardianRelationship::Mother->value,
        'guardian_phone' => '0987654321',
    ])
        ->assertOk()
        ->assertJsonPath('data.guardian_name', 'Phạm Thị E')
        ->assertJsonPath('data.guardian_relationship', GuardianRelationship::Mother->value);

    $this->assertDatabaseCount('student_guardians', 1);
    // "In place" means the very same profile row was renamed, not that a second one
    // was created alongside it: the guardian profile count stays at one, and it is
    // still the same id as before the edit.
    expect(Profile::query()->where('full_name', 'Phạm Thị E')->count())->toBe(1)
        ->and(Profile::query()->where('id', $guardianProfileId)->value('full_name'))->toBe('Phạm Thị E');
});

test('editing one sibling\'s guardian never rewrites the guardian shared with the other sibling', function () {
    $first = $this->postJson('/api/v1/students', guardianStudentPayload())->assertCreated();
    $firstId = $first->json('data.id');

    $second = $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_minh',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
    ]))->assertCreated();
    $secondId = $second->json('data.id');

    $sharedGuardianId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');

    $this->putJson("/api/v1/students/{$firstId}", [
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'status' => 0,
        'guardian_name' => 'Trần Thị Mẹ',
        'guardian_gender' => Gender::Female->value,
        'guardian_relationship' => GuardianRelationship::Mother->value,
        'guardian_phone' => '0987654321',
    ])->assertOk();

    // The edited sibling now points at a brand new guardian profile.
    $this->getJson("/api/v1/students/{$firstId}")
        ->assertOk()
        ->assertJsonPath('data.guardian_name', 'Trần Thị Mẹ')
        ->assertJsonPath('data.guardian_phone', '0987654321')
        ->assertJsonPath('data.guardian_relationship', GuardianRelationship::Mother->value);

    // The other sibling's guardian — name, phone, and relationship — is untouched.
    $this->getJson("/api/v1/students/{$secondId}")
        ->assertOk()
        ->assertJsonPath('data.guardian_name', 'Phạm Văn D')
        ->assertJsonPath('data.guardian_phone', '0912345678')
        ->assertJsonPath('data.guardian_relationship', GuardianRelationship::Father->value);

    $this->assertDatabaseHas('profiles', [
        'id' => $sharedGuardianId,
        'full_name' => 'Phạm Văn D',
        'phone' => '0912345678',
    ]);
    expect(Profile::query()->where('full_name', 'Trần Thị Mẹ')->count())->toBe(1);
    $this->assertDatabaseCount('student_guardians', 2);
});

test('an update that omits guardian_phone leaves the stored guardian phone intact', function () {
    $created = $this->postJson('/api/v1/students', guardianStudentPayload())->assertCreated();
    $studentId = $created->json('data.id');

    $this->putJson("/api/v1/students/{$studentId}", [
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'status' => 0,
        'guardian_name' => 'Phạm Văn D',
        'guardian_gender' => Gender::Male->value,
        'guardian_relationship' => GuardianRelationship::Father->value,
        // guardian_phone intentionally absent from the payload.
    ])
        ->assertOk()
        ->assertJsonPath('data.guardian_phone', '0912345678');

    $this->assertDatabaseHas('profiles', ['full_name' => 'Phạm Văn D', 'phone' => '0912345678']);
});

test('editing a sibling\'s grade level while resubmitting the same guardian values does not fork the shared guardian', function () {
    $first = $this->postJson('/api/v1/students', guardianStudentPayload())->assertCreated();
    $firstId = $first->json('data.id');

    $second = $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_minh',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
    ]))->assertCreated();
    $secondId = $second->json('data.id');

    $sharedGuardianId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');
    $profileCountBefore = Profile::query()->count();

    // Only the grade level changes; every guardian key is resubmitted unchanged, the
    // way the frontend edit form always submits all four guardian keys.
    $this->putJson("/api/v1/students/{$firstId}", [
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade10->value,
        'status' => 0,
        'guardian_name' => 'Phạm Văn D',
        'guardian_gender' => Gender::Male->value,
        'guardian_relationship' => GuardianRelationship::Father->value,
        'guardian_phone' => '0912345678',
    ])->assertOk()->assertJsonPath('data.grade_level', GradeLevel::Grade10->value);

    // No new profile was created: the family was not split across two rows that
    // describe the same person.
    expect(Profile::query()->count())->toBe($profileCountBefore);

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $firstId,
        'guardian_profile_id' => $sharedGuardianId,
    ]);
    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $secondId,
        'guardian_profile_id' => $sharedGuardianId,
    ]);
});

test('a guardian phone typo matching an existing student does not adopt that student as guardian', function () {
    $firstStudent = $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_an',
        'full_name' => 'Nguyễn Văn An',
        'phone' => '0977777777',
    ]))->assertCreated();
    $firstStudentProfileId = $firstStudent->json('data.id');

    $second = $this->postJson('/api/v1/students', guardianStudentPayload([
        'username' => 'hs_binh',
        'full_name' => 'Trần Thị Bình',
        'guardian_name' => 'Trần Văn Cường',
        // Typo: lands on the same number as the first student's own contact phone,
        // not their guardian's.
        'guardian_phone' => '0977777777',
    ]))->assertCreated();
    $secondId = $second->json('data.id');

    // The submitted guardian name is kept, not silently discarded in favour of
    // whichever profile the typo'd phone happened to match.
    $second->assertJsonPath('data.guardian_name', 'Trần Văn Cường');

    // The first student's own profile is untouched and was never adopted as a guardian.
    expect(Profile::query()->where('id', $firstStudentProfileId)->value('full_name'))->toBe('Nguyễn Văn An');

    $guardianProfileId = Profile::query()->where('full_name', 'Trần Văn Cường')->value('id');
    expect($guardianProfileId)->not->toBeNull()
        ->and($guardianProfileId)->not->toBe($firstStudentProfileId);

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $secondId,
        'guardian_profile_id' => $guardianProfileId,
    ]);
});
