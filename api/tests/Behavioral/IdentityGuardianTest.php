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
});
