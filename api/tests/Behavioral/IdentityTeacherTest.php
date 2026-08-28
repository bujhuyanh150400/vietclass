<?php

use App\Modules\Identity\Actions\ChangeTeacherPasswordAction;
use App\Modules\Identity\Actions\GetTeacherAction;
use App\Modules\Identity\Actions\ToggleTeacherAccountAction;
use App\Modules\Identity\Actions\UpdateTeacherAction;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Teacher;
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
    $this->assertDatabaseHas('teachers', ['full_name' => 'Nguyễn Văn A']);
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
    Teacher::factory()->create(['phone' => '0900000009', 'email' => 'trung@vietclass.test']);

    $this->postJson('/api/v1/teachers', teacherPayload(['username' => 'gv_trung']))
        ->assertJsonValidationErrorFor('username');

    $this->postJson('/api/v1/teachers', teacherPayload(['phone' => '0900000009']))
        ->assertJsonValidationErrorFor('phone');

    $this->postJson('/api/v1/teachers', teacherPayload(['email' => 'trung@vietclass.test']))
        ->assertJsonValidationErrorFor('email');

    $this->postJson('/api/v1/teachers', teacherPayload(['phone' => '123']))
        ->assertJsonValidationErrorFor('phone')
        ->assertJsonPath('errors.phone.0', 'Số điện thoại không hợp lệ.');

    $this->postJson('/api/v1/teachers', teacherPayload(['color' => 'orange']))
        ->assertJsonValidationErrorFor('color');
});

test('no teacher or account survives a failed creation', function () {
    $this->postJson('/api/v1/teachers', teacherPayload(['phone' => 'not-a-phone']))
        ->assertStatus(422);

    $this->assertDatabaseMissing('users', ['username' => 'gv_nguyen']);
    $this->assertDatabaseCount('teachers', 0);
});

test('the teacher list is paginated and searchable across profile and account', function () {
    $teacher = Teacher::factory()->create(['full_name' => 'Trần Thị B']);
    $teacher->user->forceFill(['username' => 'gv_tran'])->save();
    Teacher::factory()->create(['full_name' => 'Lê Văn C']);

    $this->getJson('/api/v1/teachers')
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonStructure(['data' => [['id', 'full_name', 'username', 'is_account_active']], 'meta']);

    $this->getJson('/api/v1/teachers?q=tr%E1%BA%A7n')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/teachers?q=gv_tran')->assertOk()->assertJsonPath('meta.total', 1);
});

test('the teacher list filters by employment status and account state', function () {
    Teacher::factory()->create();
    $left = Teacher::factory()->inactive()->create();
    $locked = Teacher::factory()->create();
    $locked->user->forceFill(['is_active' => false])->save();

    $this->getJson('/api/v1/teachers?status[]='.TeacherStatus::Inactive->value)
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $left->id);

    $this->getJson('/api/v1/teachers?is_active=0')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $locked->id);
});

test('updating a teacher cannot change the login name', function () {
    $teacher = Teacher::factory()->create();
    $username = $teacher->user->username;

    $this->putJson("/api/v1/teachers/{$teacher->id}", [
        'full_name' => 'Tên mới',
        'phone' => '0911111111',
        'email' => 'moi@vietclass.test',
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-02-01',
        'username' => 'gv_khac',
    ])
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Tên mới');

    expect($teacher->user->fresh()->username)->toBe($username);
});

test('a teacher may keep their own phone and email while editing', function () {
    $teacher = Teacher::factory()->create(['phone' => '0912345678', 'email' => 'giu@vietclass.test']);

    $this->putJson("/api/v1/teachers/{$teacher->id}", [
        'full_name' => 'Giữ nguyên liên hệ',
        'phone' => '0912345678',
        'email' => 'giu@vietclass.test',
        'status' => TeacherStatus::Active->value,
        'joined_at' => '2026-02-01',
    ])->assertOk();
});

test('locking a teacher account keeps the profile and its classes intact', function () {
    $teacher = Teacher::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->id}/account", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_account_active', false);

    $this->assertDatabaseHas('teachers', ['id' => $teacher->id]);
    expect($teacher->user->fresh()->is_active)->toBeFalse();
});

test('a locked teacher cannot sign in', function () {
    $teacher = Teacher::factory()->create();
    $teacher->user->forceFill(['password' => 'matkhau123'])->save();

    $this->patchJson("/api/v1/teachers/{$teacher->id}/account", ['is_active' => false])->assertOk();

    $this->postJson('/api/v1/auth/login', [
        'username' => $teacher->user->username,
        'password' => 'matkhau123',
    ])->assertUnauthorized();
});

test('changing a teacher password stores a hash and never the plain value', function () {
    $teacher = Teacher::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->id}/password", ['password' => 'matkhaumoi1'])
        ->assertNoContent();

    $stored = $teacher->user->fresh()->password;

    expect($stored)->not->toBe('matkhaumoi1')
        ->and(Hash::check('matkhaumoi1', $stored))->toBeTrue();
});

test('a short password is rejected', function () {
    $teacher = Teacher::factory()->create();

    $this->patchJson("/api/v1/teachers/{$teacher->id}/password", ['password' => 'ngan'])
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
    $available = Teacher::factory()->create(['full_name' => 'Có thể xếp lớp']);
    Teacher::factory()->inactive()->create(['full_name' => 'Đã nghỉ việc']);
    $locked = Teacher::factory()->create(['full_name' => 'Tài khoản bị khóa']);
    $locked->user->forceFill(['is_active' => false])->save();

    $this->getJson('/api/v1/teachers/options')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $available->id)
        ->assertJsonPath('data.0.label', 'Có thể xếp lớp')
        ->assertJsonStructure(['data' => [['id', 'label']]]);
});
