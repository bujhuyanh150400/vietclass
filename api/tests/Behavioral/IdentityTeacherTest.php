<?php

use App\Modules\Identity\Actions\ChangeTeacherPasswordAction;
use App\Modules\Identity\Actions\GetTeacherAction;
use App\Modules\Identity\Actions\ToggleTeacherAccountAction;
use App\Modules\Identity\Actions\UpdateTeacherAction;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function teacherPayload(array $overrides = []): array
{
    return [
        'username' => 'gv_nguyen',
        'password' => 'matkhau123',
        'full_name' => 'Nguyễn Văn A',
        'phone' => '0901234567',
        'email' => 'gv.a@vietclass.test',
        'gender' => Gender::Male->value,
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-01-15',
        ...$overrides,
    ];
}

test('creating a teacher creates the profile and its login account together', function () {
    $this->postJson('/api/v1/teachers', teacherPayload())
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Nguyễn Văn A')
        ->assertJsonPath('data.username', 'gv_nguyen')
        ->assertJsonPath('data.is_account_active', true)
        ->assertJsonPath('data.status', TeacherStatus::Active->value);

    $this->assertDatabaseHas('users', ['username' => 'gv_nguyen', 'role' => UserRole::Teacher->value]);
    $this->assertDatabaseHas('profiles', ['full_name' => 'Nguyễn Văn A']);
});

test('a created teacher can sign in with the password that was set', function () {
    $this->postJson('/api/v1/teachers', teacherPayload())->assertCreated();

    $this->postJson('/api/v1/auth/login', [
        'username' => 'gv_nguyen',
        'password' => 'matkhau123',
    ])->assertOk()->assertJsonPath('data.user.role', UserRole::Teacher->value);
});

test('a teacher payload never reports a credential back', function () {
    $response = $this->postJson('/api/v1/teachers', teacherPayload())->assertCreated();

    expect($response->json('data'))->not->toHaveKey('password')
        ->and($response->getContent())->not->toContain('matkhau123');
});

test('creating a teacher is rejected field by field', function () {
    User::factory()->create(['username' => 'gv_trung']);

    $this->postJson('/api/v1/teachers', teacherPayload(['username' => 'gv_trung']))
        ->assertJsonValidationErrorFor('username');

    $this->postJson('/api/v1/teachers', teacherPayload(['phone' => '123']))
        ->assertJsonValidationErrorFor('phone')
        ->assertJsonPath('errors.phone.0', 'Số điện thoại không hợp lệ.');

    $this->postJson('/api/v1/teachers', teacherPayload(['color_identification' => 'orange']))
        ->assertJsonValidationErrorFor('color_identification');
});

test('no teacher or account survives a failed creation', function () {
    $this->postJson('/api/v1/teachers', teacherPayload(['phone' => 'not-a-phone']))
        ->assertStatus(422);

    $this->assertDatabaseMissing('users', ['username' => 'gv_nguyen']);
    $this->assertDatabaseCount('teacher_profiles', 0);
});

test('the teacher list is paginated and searchable across profile and account', function () {
    $teacher = TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Trần Thị B'])->id,
    ]);
    $teacher->profile->user->forceFill(['username' => 'gv_tran'])->save();
    TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Lê Văn C'])->id,
    ]);

    $this->getJson('/api/v1/teachers')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonStructure(['data' => [['id', 'full_name', 'username', 'is_account_active']], 'meta']);

    $this->getJson('/api/v1/teachers?q=tr%E1%BA%A7n')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/teachers?q=gv_tran')->assertOk()->assertJsonPath('meta.total', 1);
});

test('the teacher list filters by employment status and account state', function () {
    TeacherProfile::factory()->create();
    $left = TeacherProfile::factory()->inactive()->create();
    $locked = TeacherProfile::factory()->create();
    $locked->profile->user->forceFill(['is_active' => false])->save();

    $this->getJson('/api/v1/teachers?status[]='.TeacherStatus::Inactive->value)
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $left->profile_id);

    $this->getJson('/api/v1/teachers?is_active=0')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $locked->profile_id);
});

test('updating a teacher cannot change the login name', function () {
    $teacher = TeacherProfile::factory()->create();
    $username = $teacher->profile->user->username;

    $this->putJson("/api/v1/teachers/{$teacher->profile_id}", [
        'full_name' => 'Tên mới',
        'phone' => '0911111111',
        'email' => 'moi@vietclass.test',
        'gender' => Gender::Female->value,
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-02-01',
        'username' => 'gv_khac',
    ])
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Tên mới');

    expect($teacher->profile->user->fresh()->username)->toBe($username);
});

test('a teacher may keep their own phone and email while editing', function () {
    $teacher = TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create([
            'phone' => '0912345678',
            'email' => 'giu@vietclass.test',
        ])->id,
    ]);

    $this->putJson("/api/v1/teachers/{$teacher->profile_id}", [
        'full_name' => 'Giữ nguyên liên hệ',
        'phone' => '0912345678',
        'email' => 'giu@vietclass.test',
        'gender' => Gender::Male->value,
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-02-01',
    ])->assertOk();
});

test('locking a teacher account keeps the profile and its classes intact', function () {
    $teacher = TeacherProfile::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->profile_id}/account", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_account_active', false);

    $this->assertDatabaseHas('teacher_profiles', ['profile_id' => $teacher->profile_id]);
    expect($teacher->profile->user->fresh()->is_active)->toBeFalse();
});

test('a locked teacher cannot sign in', function () {
    $teacher = TeacherProfile::factory()->create();
    $teacher->profile->user->forceFill(['password' => 'matkhau123'])->save();

    $this->patchJson("/api/v1/teachers/{$teacher->profile_id}/account", ['is_active' => false])->assertOk();

    $this->postJson('/api/v1/auth/login', [
        'username' => $teacher->profile->user->username,
        'password' => 'matkhau123',
    ])->assertUnauthorized();
});

test('changing a teacher password stores a hash and never the plain value', function () {
    $teacher = TeacherProfile::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->profile_id}/password", ['password' => 'matkhaumoi1'])
        ->assertNoContent();

    $stored = $teacher->profile->user->fresh()->password;

    expect($stored)->not->toBe('matkhaumoi1')
        ->and(Hash::check('matkhaumoi1', $stored))->toBeTrue();
});

test('a short password is rejected', function () {
    $teacher = TeacherProfile::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->profile_id}/password", ['password' => 'ngan'])
        ->assertJsonValidationErrorFor('password');
});

test('a missing teacher is reported as not found by every operation', function () {
    expect(app(GetTeacherAction::class)->handle(9999)->getError())
        ->toBe(IdentityError::TeacherNotFound)
        ->and(app(UpdateTeacherAction::class)->handle(9999, [])->getError())
        ->toBe(IdentityError::TeacherNotFound)
        ->and(app(ToggleTeacherAccountAction::class)->handle(9999, false)->getError())
        ->toBe(IdentityError::TeacherNotFound)
        ->and(app(ChangeTeacherPasswordAction::class)->handle(9999, 'matkhau123')->getError())
        ->toBe(IdentityError::TeacherNotFound);

    $this->getJson('/api/v1/teachers/9999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy giáo viên.');
});

test('the teacher option list offers only employed teachers with a usable account', function () {
    $available = TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Có thể xếp lớp'])->id,
    ]);
    TeacherProfile::factory()->inactive()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Đã nghỉ việc'])->id,
    ]);
    $locked = TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Tài khoản bị khóa'])->id,
    ]);
    $locked->profile->user->forceFill(['is_active' => false])->save();

    $this->getJson('/api/v1/teachers/options')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $available->profile_id)
        ->assertJsonPath('data.0.label', 'Có thể xếp lớp')
        ->assertJsonStructure(['data' => [['id', 'label']]]);
});

test('a teacher payload carries a gender and no bank details', function () {
    $this->postJson('/api/v1/teachers', teacherPayload(['gender' => null]))
        ->assertJsonValidationErrorFor('gender');

    $response = $this->postJson('/api/v1/teachers', teacherPayload())->assertCreated();

    expect($response->json('data'))->not->toHaveKey('bank_bin')
        ->and($response->json('data'))->not->toHaveKey('bank_account_number')
        ->and($response->json('data.gender'))->toBe(Gender::Male->value);
});

test('two teachers may share one phone number and one email', function () {
    $this->postJson('/api/v1/teachers', teacherPayload([
        'username' => 'gv_mot',
        'phone' => '0900000001',
        'email' => 'chung@vietclass.test',
    ]))->assertCreated();

    $this->postJson('/api/v1/teachers', teacherPayload([
        'username' => 'gv_hai',
        'phone' => '0900000001',
        'email' => 'chung@vietclass.test',
    ]))->assertCreated();

    $this->assertDatabaseCount('profiles', 2);
});

test('the teacher list sorts by the name held on the shared profile', function () {
    TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Trần Bích'])->id,
    ]);
    TeacherProfile::factory()->create([
        'profile_id' => Profile::factory()->forRole(UserRole::Teacher)->create(['full_name' => 'Ẩn Danh'])->id,
    ]);

    $this->getJson('/api/v1/teachers?sort=full_name&direction=asc')
        ->assertOk()
        ->assertJsonPath('data.0.full_name', 'Ẩn Danh')
        ->assertJsonPath('data.1.full_name', 'Trần Bích');
});
