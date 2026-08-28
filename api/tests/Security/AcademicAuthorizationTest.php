<?php

use App\Modules\Academic\Enums\AcademicFeature;
use App\Modules\Auth\Models\Feature;
use App\Modules\Auth\Repositories\FeatureRepository;
use App\Modules\Auth\Support\FeatureRegistry;
use App\Modules\Auth\Support\FeatureResolver;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\DB;

dataset('academic endpoints', [
    'subject list' => ['getJson', '/api/v1/subjects'],
    'subject options' => ['getJson', '/api/v1/subjects/options'],
    'subject create' => ['postJson', '/api/v1/subjects'],
    'subject detail' => ['getJson', '/api/v1/subjects/1'],
    'subject update' => ['putJson', '/api/v1/subjects/1'],
    'subject lock' => ['patchJson', '/api/v1/subjects/1/active'],
    'subject delete' => ['deleteJson', '/api/v1/subjects/1'],
    'teacher list' => ['getJson', '/api/v1/teachers'],
    'teacher options' => ['getJson', '/api/v1/teachers/options'],
    'teacher create' => ['postJson', '/api/v1/teachers'],
    'teacher detail' => ['getJson', '/api/v1/teachers/1'],
    'teacher update' => ['putJson', '/api/v1/teachers/1'],
    'teacher account' => ['patchJson', '/api/v1/teachers/1/account'],
    'teacher password' => ['patchJson', '/api/v1/teachers/1/password'],
    'class list' => ['getJson', '/api/v1/classes'],
    'class options' => ['getJson', '/api/v1/classes/options'],
    'class create' => ['postJson', '/api/v1/classes'],
    'class detail' => ['getJson', '/api/v1/classes/1'],
    'class update' => ['putJson', '/api/v1/classes/1'],
    'class status' => ['patchJson', '/api/v1/classes/1/status'],
    'student list' => ['getJson', '/api/v1/students'],
    'student create' => ['postJson', '/api/v1/students'],
    'student detail' => ['getJson', '/api/v1/students/1'],
    'student update' => ['putJson', '/api/v1/students/1'],
    'student account' => ['patchJson', '/api/v1/students/1/account'],
    'student password' => ['patchJson', '/api/v1/students/1/password'],
    'roster' => ['getJson', '/api/v1/classes/1/enrollments'],
    'available students' => ['getJson', '/api/v1/classes/1/available-students'],
    'enrol students' => ['postJson', '/api/v1/classes/1/enrollments'],
    'enrolment update' => ['putJson', '/api/v1/enrollments/1'],
    'enrolment transfer' => ['postJson', '/api/v1/enrollments/1/transfer'],
    'enrolment leave' => ['postJson', '/api/v1/enrollments/1/leave'],
]);

test('an academic endpoint refuses a request with no bearer token', function (string $method, string $uri) {
    $this->{$method}($uri)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Chưa xác thực.']);
})->with('academic endpoints');

test('an academic endpoint refuses a teacher account', function (string $method, string $uri) {
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    $this->withToken($teacher->createToken('test')->plainTextToken)
        ->{$method}($uri)
        ->assertForbidden()
        ->assertExactJson(['message' => 'Bạn không có quyền thực hiện thao tác này.']);
})->with('academic endpoints');

test('an academic endpoint refuses a guardian account', function (string $method, string $uri) {
    $guardian = User::factory()->create(['role' => UserRole::Guardian]);

    $this->withToken($guardian->createToken('test')->plainTextToken)
        ->{$method}($uri)
        ->assertForbidden();
})->with('academic endpoints');

test('an academic endpoint refuses a student account', function (string $method, string $uri) {
    $student = User::factory()->create(['role' => UserRole::Student]);

    $this->withToken($student->createToken('test')->plainTextToken)
        ->{$method}($uri)
        ->assertForbidden();
})->with('academic endpoints');

test('a deny override withdraws one permission from an administrator', function () {
    app(FeatureRepository::class)->upsertMany(app(FeatureRegistry::class)->all());

    $admin = User::factory()->create(['role' => UserRole::Admin]);

    DB::table('feature_user')->insert([
        'user_id' => $admin->id,
        'feature_id' => Feature::query()->where('code', AcademicFeature::SubjectDelete->value)->value('id'),
        'granted' => false,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    app(FeatureResolver::class)->flush();

    $this->withToken($admin->createToken('test')->plainTextToken)
        ->deleteJson('/api/v1/subjects/1')
        ->assertForbidden();
});

test('a grant override opens one permission to a teacher', function () {
    app(FeatureRepository::class)->upsertMany(app(FeatureRegistry::class)->all());

    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    DB::table('feature_user')->insert([
        'user_id' => $teacher->id,
        'feature_id' => Feature::query()->where('code', AcademicFeature::SubjectList->value)->value('id'),
        'granted' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    app(FeatureResolver::class)->flush();

    $this->withToken($teacher->createToken('test')->plainTextToken)
        ->getJson('/api/v1/subjects')
        ->assertOk();
});

test('an administrator whose account was locked after signing in loses every permission', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $token = $admin->createToken('test')->plainTextToken;

    $admin->forceFill(['is_active' => false])->save();

    $this->withToken($token)
        ->getJson('/api/v1/subjects')
        ->assertForbidden();
});
