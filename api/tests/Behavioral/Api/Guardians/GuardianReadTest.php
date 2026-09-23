<?php

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\Feature;
use App\Modules\Auth\Models\User;
use App\Modules\Auth\Repositories\FeatureRepository;
use App\Modules\Auth\Support\FeatureRegistry;
use Illuminate\Support\Facades\DB;

function readGuardian(array $attributes = []): Profile
{
    $guardian = Profile::factory()->create([
        'full_name' => 'Nguyễn Thị Hà',
        'phone' => '0911111111',
        'gender' => Gender::Female,
        ...$attributes,
    ]);
    $student = StudentProfile::factory()->create([
        'profile_id' => Profile::factory()->create(['full_name' => 'Bùi Minh An'])->id,
    ]);
    $student->guardianLinks()->create([
        'guardian_profile_id' => $guardian->id,
        'relationship' => GuardianRelationship::Mother,
        'is_primary' => true,
    ]);

    return $guardian;
}

function readTeacher(UserRole $role = UserRole::Teacher): void
{
    $user = User::factory()->create(['role' => $role]);
    test()->withToken($user->createToken('test')->plainTextToken);
}

test('a teacher can list and view every guardian with all linked students', function () {
    $first = readGuardian(['full_name' => 'Bùi Hà', 'phone' => '0911111111']);
    $second = readGuardian(['full_name' => 'Trần Hà', 'phone' => '0922222222']);
    readTeacher();

    $this->getJson('/api/v1/academic/guardians')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.students.0.full_name', 'Bùi Minh An');

    $this->getJson("/api/v1/academic/guardians/{$second->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $second->id)
        ->assertJsonPath('data.students.0.relationship', GuardianRelationship::Mother->value);

    expect($first->id)->not->toBe($second->id);
});

test('a teacher cannot access the guardian option directory', function () {
    readGuardian();
    readTeacher();

    $this->getJson('/api/v1/academic/guardians/options')->assertForbidden();
});

test('a teacher remains read-only even when mutation features are individually granted', function () {
    app(FeatureRepository::class)->upsertMany(app(FeatureRegistry::class)->all());

    $guardian = readGuardian();
    $studentId = $guardian->guardianLinks()->value('student_profile_id');
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);
    foreach (['guardian.create', 'guardian.update', 'guardian.delete', 'student.update'] as $code) {
        DB::table('feature_user')->insert([
            'user_id' => $teacher->id,
            'feature_id' => Feature::query()->where('code', $code)->value('id'),
            'granted' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    app(\App\Modules\Auth\Support\FeatureResolver::class)->flush();
    test()->withToken($teacher->createToken('test')->plainTextToken);

    $payload = [
        'full_name' => 'Tên mới',
        'phone' => '0900000000',
        'gender' => 0,
        'students' => [[
            'student_profile_id' => $studentId,
            'relationship' => 0,
            'is_primary' => true,
        ]],
    ];

    $this->getJson('/api/v1/academic/guardians')->assertOk();
    $this->getJson("/api/v1/academic/guardians/{$guardian->id}")->assertOk();
    $this->getJson('/api/v1/academic/guardians/options')->assertForbidden();
    $this->postJson('/api/v1/academic/guardians', $payload)->assertForbidden();
    $this->putJson("/api/v1/academic/guardians/{$guardian->id}", $payload)->assertForbidden();
    $this->deleteJson("/api/v1/academic/guardians/{$guardian->id}")->assertForbidden();
});

test('an administrator can access role-pure guardian options', function () {
    readGuardian();
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($admin->createToken('test')->plainTextToken)
        ->getJson('/api/v1/academic/guardians/options')
        ->assertOk();
});

test('guardian list search and resource eager loading keep the documented shape', function () {
    readGuardian(['full_name' => 'Nguyễn Văn Bố', 'phone' => '0933333333']);
    readGuardian(['full_name' => 'Trần Văn Mẹ', 'phone' => '0944444444']);
    readTeacher(UserRole::Teacher);

    $response = $this->getJson('/api/v1/academic/guardians?q=0933&per_page=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.phone', '0933333333');

    expect(array_keys($response->json('data.0')))->toBe([
        'id', 'full_name', 'phone', 'email', 'gender', 'address', 'note', 'students', 'created_at', 'updated_at',
    ]);
});

test('guardian list honors created_at sort direction', function () {
    $old = readGuardian(['full_name' => 'Cũ', 'created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
    $new = readGuardian(['full_name' => 'Mới', 'created_at' => now(), 'updated_at' => now()]);
    readTeacher(UserRole::Teacher);

    $this->getJson('/api/v1/academic/guardians?sort=created_at&direction=asc')
        ->assertOk()
        ->assertJsonPath('data.0.id', $old->id)
        ->assertJsonPath('data.1.id', $new->id);
});

test('a non guardian profile is not exposed through guardian detail', function () {
    $profile = Profile::factory()->create();
    readTeacher();

    $this->getJson("/api/v1/academic/guardians/{$profile->id}")->assertNotFound();
});
