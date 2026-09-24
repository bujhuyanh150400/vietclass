<?php

use App\Modules\Academic\Actions\UpdateTeacherAction;
use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Auth\Models\User;
use Illuminate\Validation\ValidationException;

beforeEach(function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($admin->createToken('test')->plainTextToken);
});

function academicTeacherUpdatePayload(TeacherProfile $teacher, array $overrides = []): array
{
    return [
        'full_name' => $teacher->profile->full_name,
        'phone' => $teacher->profile->phone,
        'email' => $teacher->profile->email,
        'gender' => Gender::Male->value,
        'status' => TeacherStatus::Active->value,
        'joined_at' => $teacher->joined_at->toDateString(),
        ...$overrides,
    ];
}

test('teacher option search matches the numeric profile id', function () {
    $teacher = TeacherProfile::factory()->create();

    $this->getJson('/api/v1/academic/teachers/options?q='.$teacher->profile_id)
        ->assertOk()
        ->assertJsonPath('data.0.id', $teacher->profile_id);
});

test('a teacher with no active assignments may leave without changing account lock or ended lead history', function () {
    $teacher = TeacherProfile::factory()->create();
    $teacher->profile->user->forceFill(['is_active' => false])->save();
    $endedClass = SchoolClass::factory()->ended()->create(['teacher_id' => $teacher->profile_id]);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'full_name' => 'Giáo viên đã nghỉ',
        'status' => TeacherStatus::Inactive->value,
    ]))
        ->assertOk()
        ->assertJsonPath('data.status', TeacherStatus::Inactive->value)
        ->assertJsonPath('data.is_account_active', false);

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Inactive)
        ->and($teacher->profile->fresh()->full_name)->toBe('Giáo viên đã nghỉ')
        ->and($teacher->profile->user->fresh()->is_active)->toBeFalse()
        ->and($endedClass->fresh()->teacher_id)->toBe($teacher->profile_id);
});

test('teacher detail separates ended lead and assistant assignments from current classes', function () {
    $teacher = TeacherProfile::factory()->create();
    $otherLead = TeacherProfile::factory()->create();
    $activeLead = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $endedLead = SchoolClass::factory()->ended()->create(['teacher_id' => $teacher->profile_id]);
    $activeAssistant = SchoolClass::factory()->create(['teacher_id' => $otherLead->profile_id]);
    $endedAssistant = SchoolClass::factory()->ended()->create(['teacher_id' => $otherLead->profile_id]);
    $activeAssistant->assistantTeachers()->attach($teacher->profile_id);
    $endedAssistant->assistantTeachers()->attach($teacher->profile_id);

    $this->getJson("/api/v1/academic/teachers/{$teacher->profile_id}")
        ->assertOk()
        ->assertJsonPath('data.classes.0.id', $activeLead->id)
        ->assertJsonPath('data.assistant_classes.0.id', $activeAssistant->id)
        ->assertJsonPath('data.ended_classes.0.id', $endedLead->id)
        ->assertJsonPath('data.ended_assistant_classes.0.id', $endedAssistant->id)
        ->assertJsonCount(1, 'data.classes')
        ->assertJsonCount(1, 'data.assistant_classes');

    $list = $this->getJson('/api/v1/academic/teachers')->assertOk();
    foreach ($list->json('data') as $row) {
        expect($row)->not->toHaveKeys(['ended_classes', 'ended_assistant_classes']);
    }
});

test('teacher mutation responses omit detail-only ended assignments', function () {
    $teacher = TeacherProfile::factory()->create();
    $otherLead = TeacherProfile::factory()->create();
    SchoolClass::factory()->ended()->create(['teacher_id' => $teacher->profile_id]);
    $endedAssistant = SchoolClass::factory()->ended()->create(['teacher_id' => $otherLead->profile_id]);
    $endedAssistant->assistantTeachers()->attach($teacher->profile_id);

    $updated = $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher))->assertOk();
    $account = $this->patchJson("/api/v1/academic/teachers/{$teacher->profile_id}/account", ['is_active' => false])->assertOk();

    expect($updated->json('data'))->not->toHaveKeys(['ended_classes', 'ended_assistant_classes'])
        ->and($account->json('data'))->not->toHaveKeys(['ended_classes', 'ended_assistant_classes']);
});

test('reactivating an offboarded teacher does not restore lead or assistant assignments', function () {
    $teacher = TeacherProfile::factory()->create();
    $replacement = TeacherProfile::factory()->create();
    $otherLead = TeacherProfile::factory()->create();
    $leadClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $assistantClass = SchoolClass::factory()->create(['teacher_id' => $otherLead->profile_id]);
    $assistantClass->assistantTeachers()->attach($teacher->profile_id);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$leadClass->id => $replacement->profile_id],
    ]))->assertOk();

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher))->assertOk()
        ->assertJsonPath('data.status', TeacherStatus::Active->value)
        ->assertJsonCount(0, 'data.classes')
        ->assertJsonCount(0, 'data.assistant_classes');

    expect($leadClass->fresh()->teacher_id)->toBe($replacement->profile_id)
        ->and($assistantClass->assistantTeachers()->whereKey($teacher->profile_id)->exists())->toBeFalse()
        ->and($teacher->fresh()->status)->toBe(TeacherStatus::Active);
});

test('offboarding an assistant-only teacher removes only active assistant assignments', function () {
    $teacher = TeacherProfile::factory()->create();
    $lead = TeacherProfile::factory()->create();
    $activeClass = SchoolClass::factory()->create(['teacher_id' => $lead->profile_id]);
    $endedClass = SchoolClass::factory()->ended()->create(['teacher_id' => $lead->profile_id]);
    $activeClass->assistantTeachers()->attach($teacher->profile_id);
    $endedClass->assistantTeachers()->attach($teacher->profile_id);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
    ]))->assertOk();

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Inactive)
        ->and($activeClass->assistantTeachers()->whereKey($teacher->profile_id)->exists())->toBeFalse()
        ->and($endedClass->assistantTeachers()->whereKey($teacher->profile_id)->exists())->toBeTrue();
});

test('offboarding hands off a lead class and explicitly promotes its assistant replacement', function () {
    $teacher = TeacherProfile::factory()->create();
    $replacement = TeacherProfile::factory()->create();
    $otherLead = TeacherProfile::factory()->create();
    $class = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $assistantClass = SchoolClass::factory()->create(['teacher_id' => $otherLead->profile_id]);
    $endedClass = SchoolClass::factory()->ended()->create(['teacher_id' => $teacher->profile_id]);
    $class->assistantTeachers()->attach($replacement->profile_id);
    $assistantClass->assistantTeachers()->attach($teacher->profile_id);

    $this->getJson("/api/v1/academic/teachers/{$teacher->profile_id}")
        ->assertOk()
        ->assertJsonPath('data.classes.0.id', $class->id)
        ->assertJsonPath('data.assistant_classes.0.id', $assistantClass->id);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'full_name' => 'Nghỉ có bàn giao',
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$class->id => $replacement->profile_id],
    ]))->assertOk();

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Inactive)
        ->and($class->fresh()->teacher_id)->toBe($replacement->profile_id)
        ->and($class->assistantTeachers()->whereKey($teacher->profile_id)->exists())->toBeFalse()
        ->and($class->assistantTeachers()->whereKey($replacement->profile_id)->exists())->toBeFalse()
        ->and($assistantClass->assistantTeachers()->whereKey($teacher->profile_id)->exists())->toBeFalse()
        ->and($endedClass->fresh()->teacher_id)->toBe($teacher->profile_id)
        ->and($teacher->profile->user->fresh()->is_active)->toBeTrue();

    $this->getJson("/api/v1/academic/teachers/{$teacher->profile_id}")
        ->assertOk()
        ->assertJsonCount(0, 'data.classes')
        ->assertJsonCount(0, 'data.assistant_classes');

    $this->getJson("/api/v1/academic/teachers/{$replacement->profile_id}")
        ->assertOk()
        ->assertJsonPath('data.classes.0.id', $class->id)
        ->assertJsonCount(0, 'data.assistant_classes');
});

test('offboarding replaces every active lead class using its own mapped teacher', function () {
    $teacher = TeacherProfile::factory()->create();
    $firstReplacement = TeacherProfile::factory()->create();
    $secondReplacement = TeacherProfile::factory()->create();
    $firstClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $secondClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [
            $firstClass->id => $firstReplacement->profile_id,
            $secondClass->id => $secondReplacement->profile_id,
        ],
    ]))->assertOk();

    expect($firstClass->fresh()->teacher_id)->toBe($firstReplacement->profile_id)
        ->and($secondClass->fresh()->teacher_id)->toBe($secondReplacement->profile_id)
        ->and($teacher->fresh()->status)->toBe(TeacherStatus::Inactive);
});

test('a missing replacement is reported for its class and does not update the teacher profile', function () {
    $teacher = TeacherProfile::factory()->create();
    $class = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'full_name' => 'Không được lưu',
        'status' => TeacherStatus::Inactive->value,
    ]))
        ->assertJsonValidationErrorFor("replacement_teacher_ids.{$class->id}");

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Active)
        ->and($teacher->profile->fresh()->full_name)->toBe($teacher->profile->full_name)
        ->and($class->fresh()->teacher_id)->toBe($teacher->profile_id)
        ->and($teacher->profile->user->fresh()->is_active)->toBeTrue();
});

test('self and inactive replacement teachers are rejected on the affected class fields', function () {
    $teacher = TeacherProfile::factory()->create();
    $inactiveReplacement = TeacherProfile::factory()->inactive()->create();
    $firstClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $secondClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $thirdClass = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$firstClass->id => $teacher->profile_id],
    ]))->assertJsonValidationErrorFor("replacement_teacher_ids.{$firstClass->id}");

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$secondClass->id => $inactiveReplacement->profile_id],
    ]))->assertJsonValidationErrorFor("replacement_teacher_ids.{$secondClass->id}");

    $this->putJson("/api/v1/academic/teachers/{$teacher->profile_id}", academicTeacherUpdatePayload($teacher, [
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$thirdClass->id => PHP_INT_MAX],
    ]))->assertJsonValidationErrorFor("replacement_teacher_ids.{$thirdClass->id}");

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Active)
        ->and($firstClass->fresh()->teacher_id)->toBe($teacher->profile_id)
        ->and($secondClass->fresh()->teacher_id)->toBe($teacher->profile_id)
        ->and($thirdClass->fresh()->teacher_id)->toBe($teacher->profile_id);
});

test('a failed locked handoff rolls back other profile edits and leaves account state unchanged', function () {
    $teacher = TeacherProfile::factory()->create();
    $inactiveReplacement = TeacherProfile::factory()->inactive()->create();
    $class = SchoolClass::factory()->create(['teacher_id' => $teacher->profile_id]);
    $originalName = $teacher->profile->full_name;

    expect(fn () => app(UpdateTeacherAction::class)->handle($teacher->profile_id, [
        'full_name' => 'Không được lưu',
        'status' => TeacherStatus::Inactive->value,
        'replacement_teacher_ids' => [$class->id => $inactiveReplacement->profile_id],
    ]))->toThrow(ValidationException::class);

    expect($teacher->fresh()->status)->toBe(TeacherStatus::Active)
        ->and($teacher->profile->fresh()->full_name)->toBe($originalName)
        ->and($teacher->profile->user->fresh()->is_active)->toBeTrue()
        ->and($class->fresh()->teacher_id)->toBe($teacher->profile_id);
});
