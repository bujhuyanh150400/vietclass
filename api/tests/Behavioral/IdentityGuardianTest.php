<?php

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Academic\Models\Profile;
use App\Modules\Auth\Models\User;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

/** One roster entry describing somebody not yet on file. */
function newGuardian(array $overrides = []): array
{
    return [
        'name' => 'Phạm Văn D',
        'gender' => Gender::Male->value,
        'phone' => '0912345678',
        'relationship' => GuardianRelationship::Father->value,
        ...$overrides,
    ];
}

function guardianStudentPayload(array $overrides = []): array
{
    return [
        'username' => 'hs_linh',
        'password' => 'matkhau123',
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'guardians' => [newGuardian()],
        ...$overrides,
    ];
}

/** The profile fields an update must resend, since the endpoint requires them. */
function studentProfileUpdate(array $overrides = []): array
{
    return [
        'full_name' => 'Phạm Thùy Linh',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade9->value,
        'status' => 0,
        ...$overrides,
    ];
}

test('creating a student links everybody in the roster, the first as main contact', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [
            newGuardian(),
            newGuardian([
                'name' => 'Nguyễn Thị E',
                'gender' => Gender::Female->value,
                'phone' => '0912345679',
                'relationship' => GuardianRelationship::Mother->value,
            ]),
        ],
    ]))
        ->assertCreated()
        ->assertJsonCount(2, 'data.guardians')
        // No entry claimed the flag, so the first one carries it: a student with
        // anybody linked always has somebody the school calls first.
        ->assertJsonPath('data.guardians.0.full_name', 'Phạm Văn D')
        ->assertJsonPath('data.guardians.0.is_primary', true)
        ->assertJsonPath('data.guardians.1.full_name', 'Nguyễn Thị E')
        ->assertJsonPath('data.guardians.1.is_primary', false);

    $this->assertDatabaseCount('student_guardians', 2);
    $this->assertDatabaseHas('profiles', ['full_name' => 'Phạm Văn D', 'user_id' => null]);
});

test('the roster says which link is the main contact', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [
            newGuardian(),
            newGuardian([
                'name' => 'Nguyễn Thị E',
                'gender' => Gender::Female->value,
                'phone' => '0912345679',
                'relationship' => GuardianRelationship::Mother->value,
                'is_primary' => true,
            ]),
        ],
    ]))
        ->assertCreated()
        // Main contact first in the response, whatever order it arrived in.
        ->assertJsonPath('data.guardians.0.full_name', 'Nguyễn Thị E')
        ->assertJsonPath('data.guardians.0.is_primary', true)
        ->assertJsonPath('data.guardian_name', 'Nguyễn Thị E');
});

test('a roster naming two main contacts is refused', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [
            newGuardian(['is_primary' => true]),
            newGuardian([
                'name' => 'Nguyễn Thị E',
                'phone' => '0912345679',
                'is_primary' => true,
            ]),
        ],
    ]))->assertJsonValidationErrorFor('guardians');

    $this->assertDatabaseCount('student_guardians', 0);
});

test('a person linked as guardian can also be a guardian of a sibling', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();

    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_minh',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
    ]))->assertCreated();

    // One phone number and one name, so both forms resolved to the same person.
    expect(Profile::query()->where('full_name', 'Phạm Văn D')->count())->toBe(1);
    $this->assertDatabaseCount('student_guardians', 2);
});

test('a guardian entered without a phone number gets a profile of their own', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [newGuardian(['phone' => null])],
    ]))->assertCreated();

    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_khac',
        'guardians' => [newGuardian(['phone' => null])],
    ]))->assertCreated();

    // Nothing to match on, so no guess is made about them being the same human being.
    expect(Profile::query()->where('full_name', 'Phạm Văn D')->count())->toBe(2);
});

test('a roster entry must name either somebody on file or somebody new, not both', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $guardianProfileId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');

    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_caihai',
        'guardians' => [newGuardian(['guardian_profile_id' => $guardianProfileId])],
    ]))->assertJsonValidationErrorFor('guardians.0.guardian_profile_id');
});

test('a roster entry must name one of the two, not neither', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [['relationship' => GuardianRelationship::Father->value]],
    ]))->assertJsonValidationErrorFor('guardians.0.name');
});

test('somebody typed in needs a gender, and every entry needs a relationship', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [newGuardian(['gender' => null])],
    ]))->assertJsonValidationErrorFor('guardians.0.gender');

    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [newGuardian(['relationship' => null])],
    ]))->assertJsonValidationErrorFor('guardians.0.relationship');
});

test('a student can be created with nobody linked at all', function () {
    $created = $this->postJson('/api/v1/academic/students', [
        'username' => 'hs_khongph',
        'password' => 'matkhau123',
        'full_name' => 'Lê Vô Danh',
        'gender' => Gender::Male->value,
        'grade_level' => GradeLevel::Grade6->value,
    ])
        ->assertCreated()
        ->assertJsonPath('data.guardian_name', null)
        // An empty list, never null: a reader never has to tell "no guardian" from
        // "not reported".
        ->assertJsonPath('data.guardians', []);

    $this->assertDatabaseCount('student_guardians', 0);
    // Exactly one profile exists — the student's own. No placeholder was left behind
    // for the guardian that was skipped.
    expect(Profile::query()->count())->toBe(1);

    $studentId = $created->json('data.id');

    // The student stays editable, which is the whole point of allowing none: an edit
    // that draws no roster must not invent one on the first save.
    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate([
        'full_name' => 'Lê Vô Danh',
        'gender' => Gender::Male->value,
        'grade_level' => GradeLevel::Grade7->value,
    ]))
        ->assertOk()
        ->assertJsonPath('data.grade_level', GradeLevel::Grade7->value)
        ->assertJsonPath('data.guardians', []);

    $this->assertDatabaseCount('student_guardians', 0);
    expect(Profile::query()->count())->toBe(1);
});

test('a student can be linked to somebody already on file by identifier', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $guardianProfileId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');
    $profileCountBefore = Profile::query()->count();

    $this->postJson('/api/v1/academic/students', [
        'username' => 'hs_em',
        'password' => 'matkhau123',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
        'grade_level' => GradeLevel::Grade6->value,
        'guardians' => [[
            'guardian_profile_id' => $guardianProfileId,
            'relationship' => GuardianRelationship::Father->value,
        ]],
    ])
        ->assertCreated()
        ->assertJsonPath('data.guardians.0.full_name', 'Phạm Văn D')
        ->assertJsonPath('data.guardians.0.phone', '0912345678');

    // The picked person was used as given: one more student, but no extra profile.
    expect(Profile::query()->count())->toBe($profileCountBefore + 1)
        ->and(Profile::query()->where('full_name', 'Phạm Văn D')->count())->toBe(1);
    $this->assertDatabaseCount('student_guardians', 2);
});

test('the same person cannot appear twice in one roster', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $guardianProfileId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');

    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_trung',
        'guardians' => [
            ['guardian_profile_id' => $guardianProfileId, 'relationship' => GuardianRelationship::Father->value],
            ['guardian_profile_id' => $guardianProfileId, 'relationship' => GuardianRelationship::Mother->value],
        ],
    ]))->assertJsonValidationErrorFor('guardians.1.guardian_profile_id');
});

test('linking by identifier refuses a profile that holds a student role', function () {
    $student = $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();

    $this->postJson('/api/v1/academic/students', [
        'username' => 'hs_khac2',
        'password' => 'matkhau123',
        'full_name' => 'Đỗ Thị Mai',
        'gender' => Gender::Female->value,
        'grade_level' => GradeLevel::Grade8->value,
        'guardians' => [[
            'guardian_profile_id' => $student->json('data.id'),
            'relationship' => GuardianRelationship::Guardian->value,
        ]],
    ])
        ->assertNotFound()
        ->assertJsonPath('message', 'Không tìm thấy phụ huynh.');

    // The refused request left nothing behind — not the account, not the profile.
    $this->assertDatabaseMissing('users', ['username' => 'hs_khac2']);
    $this->assertDatabaseMissing('profiles', ['full_name' => 'Đỗ Thị Mai']);
});

test('linking by identifier refuses an identifier that matches nothing', function () {
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [[
            'guardian_profile_id' => 999999,
            'relationship' => GuardianRelationship::Father->value,
        ]],
    ]))->assertNotFound();
});

test('a roster is capped, so one payload cannot link an unbounded crowd', function () {
    $roster = [];

    for ($index = 0; $index < 11; $index++) {
        $roster[] = newGuardian(['name' => "Người {$index}", 'phone' => null]);
    }

    $this->postJson('/api/v1/academic/students', guardianStudentPayload(['guardians' => $roster]))
        ->assertJsonValidationErrorFor('guardians');
});

test('an update that omits the roster leaves every existing link untouched', function () {
    $created = $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $studentId = $created->json('data.id');

    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate([
        'grade_level' => GradeLevel::Grade10->value,
        // No guardians key at all: this is not a request to change who is linked.
    ]))
        ->assertOk()
        ->assertJsonPath('data.grade_level', GradeLevel::Grade10->value)
        ->assertJsonCount(1, 'data.guardians')
        ->assertJsonPath('data.guardians.0.full_name', 'Phạm Văn D');

    $this->assertDatabaseCount('student_guardians', 1);
});

test('an update sends the whole roster, so somebody left out is unlinked', function () {
    $created = $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [
            newGuardian(),
            newGuardian(['name' => 'Nguyễn Thị E', 'phone' => '0912345679', 'gender' => Gender::Female->value]),
        ],
    ]))->assertCreated();
    $studentId = $created->json('data.id');
    $keepId = Profile::query()->where('full_name', 'Nguyễn Thị E')->value('id');

    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate([
        'guardians' => [[
            'guardian_profile_id' => $keepId,
            'relationship' => GuardianRelationship::Mother->value,
            'is_primary' => true,
        ]],
    ]))
        ->assertOk()
        ->assertJsonCount(1, 'data.guardians')
        ->assertJsonPath('data.guardians.0.full_name', 'Nguyễn Thị E');

    $this->assertDatabaseCount('student_guardians', 1);
    // Unlinking drops the link, never the person: they may still be a sibling's parent.
    $this->assertDatabaseHas('profiles', ['full_name' => 'Phạm Văn D']);
});

test('an update with an empty roster unlinks everybody', function () {
    $created = $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $studentId = $created->json('data.id');

    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate(['guardians' => []]))
        ->assertOk()
        ->assertJsonPath('data.guardians', [])
        ->assertJsonPath('data.guardian_name', null);

    $this->assertDatabaseCount('student_guardians', 0);
    $this->assertDatabaseHas('profiles', ['full_name' => 'Phạm Văn D']);
});

test('an update can move the main contact to another link', function () {
    $created = $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'guardians' => [
            newGuardian(),
            newGuardian(['name' => 'Nguyễn Thị E', 'phone' => '0912345679', 'gender' => Gender::Female->value]),
        ],
    ]))->assertCreated();
    $studentId = $created->json('data.id');
    $fatherId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');
    $motherId = Profile::query()->where('full_name', 'Nguyễn Thị E')->value('id');

    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate([
        'guardians' => [
            ['guardian_profile_id' => $fatherId, 'relationship' => GuardianRelationship::Father->value],
            [
                'guardian_profile_id' => $motherId,
                'relationship' => GuardianRelationship::Mother->value,
                'is_primary' => true,
            ],
        ],
    ]))
        ->assertOk()
        ->assertJsonPath('data.guardians.0.full_name', 'Nguyễn Thị E')
        ->assertJsonPath('data.guardians.0.is_primary', true);

    // The partial unique index permits exactly one primary row per student, so moving
    // the flag has to clear the old row before setting the new one.
    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $studentId,
        'guardian_profile_id' => $motherId,
        'is_primary' => true,
    ]);
    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $studentId,
        'guardian_profile_id' => $fatherId,
        'is_primary' => false,
    ]);
});

test('editing one sibling never rewrites the person shared with the other sibling', function () {
    $first = $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_minh',
        'full_name' => 'Phạm Nhật Minh',
        'gender' => Gender::Male->value,
    ]))->assertCreated();

    $sharedId = Profile::query()->where('full_name', 'Phạm Văn D')->value('id');
    expect($sharedId)->not->toBeNull();

    // The elder child's roster now names somebody else entirely.
    $this->putJson("/api/v1/academic/students/{$first->json('data.id')}", studentProfileUpdate([
        'guardians' => [newGuardian(['name' => 'Trần Thị Hạnh', 'phone' => '0900000001', 'gender' => Gender::Female->value])],
    ]))->assertOk();

    // The shared profile is untouched, and the sibling still points at it. Editing a
    // roster changes who this student is linked to, never who those people are.
    expect(Profile::query()->where('id', $sharedId)->value('full_name'))->toBe('Phạm Văn D');
    $this->assertDatabaseHas('student_guardians', ['guardian_profile_id' => $sharedId]);
});

test('a guardian phone typo matching an existing student does not adopt that student', function () {
    $firstStudent = $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_an',
        'full_name' => 'Nguyễn Văn An',
        'phone' => '0977777777',
    ]))->assertCreated();
    $firstStudentProfileId = $firstStudent->json('data.id');

    $second = $this->postJson('/api/v1/academic/students', guardianStudentPayload([
        'username' => 'hs_binh',
        'full_name' => 'Trần Thị Bình',
        'guardians' => [newGuardian([
            'name' => 'Trần Văn Cường',
            // Typo: lands on the same number as the first student's own contact phone,
            // not their guardian's.
            'phone' => '0977777777',
        ])],
    ]))->assertCreated();

    // The submitted name is kept, not silently discarded in favour of whichever
    // profile the typo'd phone happened to match.
    $second->assertJsonPath('data.guardians.0.full_name', 'Trần Văn Cường');

    // The first student's own profile is untouched and was never adopted as a guardian.
    expect(Profile::query()->where('id', $firstStudentProfileId)->value('full_name'))->toBe('Nguyễn Văn An');

    $guardianProfileId = Profile::query()->where('full_name', 'Trần Văn Cường')->value('id');
    expect($guardianProfileId)->not->toBeNull()
        ->and($guardianProfileId)->not->toBe($firstStudentProfileId);

    $this->assertDatabaseHas('student_guardians', [
        'student_profile_id' => $second->json('data.id'),
        'guardian_profile_id' => $guardianProfileId,
    ]);
});

test('a student cannot be linked as their own guardian', function () {
    $created = $this->postJson('/api/v1/academic/students', guardianStudentPayload())->assertCreated();
    $studentId = $created->json('data.id');

    $this->putJson("/api/v1/academic/students/{$studentId}", studentProfileUpdate([
        'guardians' => [[
            'guardian_profile_id' => $studentId,
            'relationship' => GuardianRelationship::Guardian->value,
        ]],
    ]))->assertNotFound();
});
