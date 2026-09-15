<?php

use App\Modules\System\Models\FileLink;
use App\Modules\System\Models\ManagedFile;
use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Enums\StudentStatus;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Academic\Models\Profile;
use App\Modules\Auth\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake('managed-files');
    config()->set('system.files.disk', 'managed-files');

    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($admin->createToken('identity-avatar')->plainTextToken);
});

function multipartStudentPayload(array $overrides = []): array
{
    return [
        'username' => 'avatar_student',
        'password' => 'matkhau123',
        'full_name' => 'Avatar Student',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'guardian_name' => 'Guardian Student',
        'guardian_gender' => Gender::Male->value,
        'guardian_relationship' => GuardianRelationship::Father->value,
        'status' => StudentStatus::Studying->value,
        ...$overrides,
    ];
}

function multipartTeacherPayload(array $overrides = []): array
{
    return [
        'username' => 'avatar_teacher',
        'password' => 'matkhau123',
        'full_name' => 'Avatar Teacher',
        'phone' => '0901234567',
        'email' => 'avatar.teacher@vietclass.test',
        'gender' => Gender::Female->value,
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-09-04',
        ...$overrides,
    ];
}

test('student creation accepts a multipart file avatar and commits its file link', function (): void {
    $response = $this->post('/api/v1/academic/students', [
        'payload' => json_encode(multipartStudentPayload(['avatar' => ['type' => 'file']]), JSON_THROW_ON_ERROR),
        'avatar_file' => fakeJpeg('student.jpg'),
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.avatar.type', 'file');

    expect(ManagedFile::query()->count())->toBe(1)
        ->and(FileLink::query()->count())->toBe(1);
});

test('teacher creation accepts a JSON DiceBear avatar and keeps its resource shape', function (): void {
    $this->postJson('/api/v1/academic/teachers', multipartTeacherPayload([
        'avatar' => ['type' => 'dicebear', 'style' => 'adventurer', 'seed' => 'teacher', 'options' => []],
    ]))->assertCreated()
        ->assertJsonPath('data.profile_id', Profile::query()->where('full_name', 'Avatar Teacher')->value('id'))
        ->assertJsonPath('data.avatar.type', 'dicebear')
        ->assertJsonPath('data.avatar.seed', 'teacher');
});

test('multipart avatar validation rejects a missing file, an unexpected file, and malformed payload', function (): void {
    $this->post('/api/v1/academic/students', [
        'payload' => json_encode(multipartStudentPayload(['avatar' => ['type' => 'file']]), JSON_THROW_ON_ERROR),
    ])->assertJsonValidationErrorFor('avatar_file');

    $this->post('/api/v1/academic/teachers', [
        'payload' => json_encode(multipartTeacherPayload(['avatar' => ['type' => 'dicebear', 'style' => 'adventurer', 'seed' => 'x', 'options' => []]]), JSON_THROW_ON_ERROR),
        'avatar_file' => fakeJpeg('unexpected.jpg'),
    ])->assertJsonValidationErrorFor('avatar_file');

    $this->post('/api/v1/academic/students', ['payload' => '[]'])
        ->assertJsonValidationErrorFor('payload');
});

test('a failed avatar write rolls back the account, profile, student, and file metadata', function (): void {
    $disk = Mockery::mock();
    $disk->shouldReceive('putFileAs')->once()->andReturnFalse();
    $disk->shouldReceive('delete')->once()->andReturnTrue();
    Storage::shouldReceive('disk')->twice()->with('managed-files')->andReturn($disk);

    $this->post('/api/v1/academic/students', [
        'payload' => json_encode(multipartStudentPayload(['avatar' => ['type' => 'file']]), JSON_THROW_ON_ERROR),
        'avatar_file' => fakeJpeg('broken.jpg'),
    ])->assertStatus(503);

    $this->assertDatabaseMissing('users', ['username' => 'avatar_student']);
    $this->assertDatabaseCount('student_profiles', 0);
    $this->assertDatabaseCount('files', 0);
});

test('login and current user responses include the profile avatar union', function (): void {
    $user = User::factory()->withProfile()->create([
        'username' => 'profile_user',
        'password' => 'password',
        'role' => UserRole::Teacher,
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'username' => 'profile_user',
        'password' => 'password',
    ])->assertOk()
        ->assertJsonPath('data.user.profile_id', $user->profile->id)
        ->assertJsonPath('data.user.avatar', null);

    $this->withToken($login->json('data.token'))
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.profile_id', $user->profile->id)
        ->assertJsonPath('data.avatar', null);
});
