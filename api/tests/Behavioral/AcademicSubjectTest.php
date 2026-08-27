<?php

use App\Modules\Academic\Actions\DeleteSubjectAction;
use App\Modules\Academic\Actions\GetSubjectAction;
use App\Modules\Academic\Actions\ToggleSubjectActiveAction;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

test('the subject list is paginated with the shared meta envelope', function () {
    Subject::factory()->count(3)->create();

    $this->getJson('/api/v1/subjects?per_page=2')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonStructure([
            'data' => [['id', 'name', 'description', 'is_active', 'active_classes_count', 'created_at', 'updated_at']],
            'meta' => ['current_page', 'per_page', 'total', 'last_page'],
        ]);
});

test('the subject list rejects paging and sorting values outside the contract', function () {
    $this->getJson('/api/v1/subjects?per_page=500')->assertJsonValidationErrorFor('per_page');
    $this->getJson('/api/v1/subjects?page=0')->assertJsonValidationErrorFor('page');
    $this->getJson('/api/v1/subjects?sort=password')->assertJsonValidationErrorFor('sort');
    $this->getJson('/api/v1/subjects?direction=sideways')->assertJsonValidationErrorFor('direction');
});

test('the subject list searches by name and filters by locked state', function () {
    Subject::factory()->create(['name' => 'Toán nâng cao']);
    Subject::factory()->create(['name' => 'Ngữ văn']);
    Subject::factory()->inactive()->create(['name' => 'Toán cơ bản']);

    $this->getJson('/api/v1/subjects?q=to%C3%A1n')
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    $this->getJson('/api/v1/subjects?is_active=0')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.name', 'Toán cơ bản');
});

test('a literal wildcard in the search term matches itself', function () {
    Subject::factory()->create(['name' => 'Toán 100%']);
    Subject::factory()->create(['name' => 'Ngữ văn']);

    $this->getJson('/api/v1/subjects?q=100%25')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

test('a subject is created and reported back', function () {
    $this->postJson('/api/v1/subjects', [
        'name' => 'Vật lý',
        'description' => 'Khối trung học phổ thông',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Vật lý')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('subjects', ['name' => 'Vật lý', 'is_active' => true]);
});

test('a duplicate subject name is reported against the name field', function () {
    Subject::factory()->create(['name' => 'Hóa học']);

    $this->postJson('/api/v1/subjects', ['name' => 'Hóa học'])
        ->assertJsonValidationErrorFor('name')
        ->assertJsonPath('errors.name.0', 'Tên môn học này đã tồn tại trong hệ thống.');
});

test('a subject name may be kept while editing its other fields', function () {
    $subject = Subject::factory()->create(['name' => 'Sinh học']);

    $this->putJson("/api/v1/subjects/{$subject->id}", [
        'name' => 'Sinh học',
        'description' => 'Đã cập nhật',
    ])
        ->assertOk()
        ->assertJsonPath('data.description', 'Đã cập nhật');
});

test('updating a subject cannot change its locked state', function () {
    $subject = Subject::factory()->create(['name' => 'Địa lý']);

    $this->putJson("/api/v1/subjects/{$subject->id}", [
        'name' => 'Địa lý',
        'is_active' => false,
    ])->assertOk();

    expect($subject->fresh()->is_active)->toBeTrue();
});

test('a subject is locked and unlocked through its own endpoint', function () {
    $subject = Subject::factory()->create();

    $this->patchJson("/api/v1/subjects/{$subject->id}/active", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    $this->patchJson("/api/v1/subjects/{$subject->id}/active", ['is_active' => true])
        ->assertOk()
        ->assertJsonPath('data.is_active', true);
});

test('a subject taught by a running class cannot be locked', function () {
    $class = SchoolClass::factory()->create();

    $this->patchJson("/api/v1/subjects/{$class->subject_id}/active", ['is_active' => false])
        ->assertStatus(409)
        ->assertJsonPath('message', 'Môn học đang được dùng bởi 1 lớp đang hoạt động, không thể khóa.');

    expect($class->subject->fresh()->is_active)->toBeTrue();
});

test('a subject whose classes have all finished can be locked', function () {
    $class = SchoolClass::factory()->ended()->create();

    $this->patchJson("/api/v1/subjects/{$class->subject_id}/active", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false);
});

test('a subject no class references is removed', function () {
    $subject = Subject::factory()->create();

    $this->deleteJson("/api/v1/subjects/{$subject->id}")->assertNoContent();

    $this->assertDatabaseMissing('subjects', ['id' => $subject->id]);
});

test('a subject referenced by a finished class still cannot be removed', function () {
    $class = SchoolClass::factory()->ended()->create();

    $result = app(DeleteSubjectAction::class)->handle($class->subject_id);

    expect($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(AcademicError::SubjectInUse)
        ->and($result->getMessage())->toBe('Môn học đang được dùng bởi 1 lớp, không thể xóa.');

    $this->assertDatabaseHas('subjects', ['id' => $class->subject_id]);
});

test('a missing subject is reported as not found by every operation', function () {
    expect(app(GetSubjectAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::SubjectNotFound)
        ->and(app(DeleteSubjectAction::class)->handle(9999)->getError())
        ->toBe(AcademicError::SubjectNotFound)
        ->and(app(ToggleSubjectActiveAction::class)->handle(9999, false)->getError())
        ->toBe(AcademicError::SubjectNotFound);

    $this->getJson('/api/v1/subjects/9999')
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy môn học.');
});

test('the subject option list offers only unlocked subjects', function () {
    Subject::factory()->create(['name' => 'Toán']);
    Subject::factory()->inactive()->create(['name' => 'Toán cũ']);

    $this->getJson('/api/v1/subjects/options')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Toán')
        ->assertJsonStructure(['data' => [['id', 'label']]]);
});
