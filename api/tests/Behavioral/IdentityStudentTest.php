<?php

use App\Modules\Identity\Actions\ChangeStudentPasswordAction;
use App\Modules\Identity\Actions\GetStudentAction;
use App\Modules\Identity\Actions\ToggleStudentAccountAction;
use App\Modules\Identity\Actions\UpdateStudentAction;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function studentPayload(array $overrides = []): array
{
    return [
        'username' => 'hs_linh',
        'password' => 'matkhau123',
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'parent_name' => 'Phạm Văn D',
        ...$overrides,
    ];
}

test('creating a student creates the profile and its login account together', function () {
    $this->postJson('/api/v1/students', studentPayload())
        ->assertCreated()
        ->assertJsonPath('data.full_name', 'Phạm Thùy Linh')
        ->assertJsonPath('data.username', 'hs_linh')
        ->assertJsonPath('data.status', StudentStatus::Studying->value)
        ->assertJsonPath('data.is_account_active', true);

    $this->assertDatabaseHas('users', ['username' => 'hs_linh', 'role' => UserRole::Student->value]);
});

test('a created student can sign in with the password that was set', function () {
    $this->postJson('/api/v1/students', studentPayload())->assertCreated();

    $this->postJson('/api/v1/auth/login', [
        'username' => 'hs_linh',
        'password' => 'matkhau123',
    ])->assertOk()->assertJsonPath('data.user.role', UserRole::Student->value);
});

test('a student payload never reports a credential back', function () {
    $response = $this->postJson('/api/v1/students', studentPayload())->assertCreated();

    expect($response->json('data'))->not->toHaveKey('password')
        ->and($response->getContent())->not->toContain('matkhau123');
});

test('a guardian name is required while student contact details are not', function () {
    $this->postJson('/api/v1/students', studentPayload(['parent_name' => null]))
        ->assertJsonValidationErrorFor('parent_name');

    $this->postJson('/api/v1/students', studentPayload())
        ->assertCreated()
        ->assertJsonPath('data.phone', null)
        ->assertJsonPath('data.dob', null);
});

test('a date of birth must be in the past', function () {
    $this->postJson('/api/v1/students', studentPayload(['dob' => now()->addYear()->toDateString()]))
        ->assertJsonValidationErrorFor('dob')
        ->assertJsonPath('errors.dob.0', 'Ngày sinh phải trước ngày hôm nay.');

    $this->postJson('/api/v1/students', studentPayload(['dob' => '2012-05-04']))
        ->assertCreated()
        ->assertJsonPath('data.dob', '2012-05-04');
});

test('student and guardian phone numbers are checked for shape', function () {
    $this->postJson('/api/v1/students', studentPayload(['phone' => '123']))
        ->assertJsonValidationErrorFor('phone')
        ->assertJsonPath('errors.phone.0', 'Số điện thoại không hợp lệ.');

    $this->postJson('/api/v1/students', studentPayload(['parent_phone' => 'abc']))
        ->assertJsonValidationErrorFor('parent_phone')
        ->assertJsonPath('errors.parent_phone.0', 'Số điện thoại phụ huynh không hợp lệ.');
});

test('a duplicate login name is reported against the username field', function () {
    User::factory()->create(['username' => 'hs_trung']);

    $this->postJson('/api/v1/students', studentPayload(['username' => 'hs_trung']))
        ->assertJsonValidationErrorFor('username');
});

test('no student or account survives a failed creation', function () {
    $this->postJson('/api/v1/students', studentPayload(['gender' => 99]))->assertStatus(422);

    $this->assertDatabaseMissing('users', ['username' => 'hs_linh']);
    $this->assertDatabaseCount('students', 0);
});

test('updating a student cannot change the login name', function () {
    $student = Student::factory()->create();
    $username = $student->user->username;

    $this->putJson("/api/v1/students/{$student->id}", [
        'full_name' => 'Tên mới',
        'gender' => Gender::Male->value,
        'grade_level' => GradeLevel::Grade10->value,
        'parent_name' => 'Phụ huynh mới',
        'status' => StudentStatus::Paused->value,
        'username' => 'hs_khac',
    ])
        ->assertOk()
        ->assertJsonPath('data.full_name', 'Tên mới')
        ->assertJsonPath('data.status', StudentStatus::Paused->value);

    expect($student->user->fresh()->username)->toBe($username);
});

test('the student list is paginated and searchable across profile and guardian', function () {
    $student = Student::factory()->create(['full_name' => 'Ngô Bảo Châu', 'parent_name' => 'Ngô Văn E']);
    $student->user->forceFill(['username' => 'hs_chau'])->save();
    Student::factory()->create(['full_name' => 'Đỗ Thị F']);

    $this->getJson('/api/v1/students')->assertOk()->assertJsonPath('meta.total', 2);
    $this->getJson('/api/v1/students?q=b%E1%BA%A3o')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/students?q=Ng%C3%B4%20V%C4%83n')->assertOk()->assertJsonPath('meta.total', 1);
    $this->getJson('/api/v1/students?q=hs_chau')->assertOk()->assertJsonPath('meta.total', 1);
});

test('the student list filters by study status, grade, and account state', function () {
    $studying = Student::factory()->create(['grade_level' => GradeLevel::Grade6]);
    $stopped = Student::factory()->create(['status' => StudentStatus::Stopped]);
    $locked = Student::factory()->create();
    $locked->user->forceFill(['is_active' => false])->save();

    $this->getJson('/api/v1/students?status[]='.StudentStatus::Stopped->value)
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $stopped->id);

    $this->getJson('/api/v1/students?grade_level[]='.GradeLevel::Grade6->value)
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $studying->id);

    $this->getJson('/api/v1/students?is_active=0')
        ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $locked->id);
});

test('locking a student account keeps the profile intact', function () {
    $student = Student::factory()->create();

    $this->patchJson("/api/v1/students/{$student->id}/account", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_account_active', false)
        ->assertJsonPath('data.status', StudentStatus::Studying->value);

    $this->assertDatabaseHas('students', ['id' => $student->id]);
});

test('changing a student password stores a hash and never the plain value', function () {
    $student = Student::factory()->create();

    $this->patchJson("/api/v1/students/{$student->id}/password", ['password' => 'matkhaumoi1'])
        ->assertNoContent();

    expect(Hash::check('matkhaumoi1', $student->user->fresh()->password))->toBeTrue();
});

test('a missing student is reported as not found by every operation', function () {
    expect(app(GetStudentAction::class)->handle(9999)->getError())
        ->toBe(IdentityError::StudentNotFound)
        ->and(app(UpdateStudentAction::class)->handle(9999, [])->getError())
        ->toBe(IdentityError::StudentNotFound)
        ->and(app(ToggleStudentAccountAction::class)->handle(9999, false)->getError())
        ->toBe(IdentityError::StudentNotFound)
        ->and(app(ChangeStudentPasswordAction::class)->handle(9999, 'matkhau123')->getError())
        ->toBe(IdentityError::StudentNotFound);

    $this->getJson('/api/v1/students/9999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy học sinh.');
});
