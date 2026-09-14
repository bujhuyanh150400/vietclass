<?php

use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\User;

beforeEach(function (): void {
    $this->admin = User::factory()->create(['role' => UserRole::Admin]);
    $this->withToken($this->admin->createToken('test')->plainTextToken);
});

function guardianOnFile(string $name, ?string $phone = null): Profile
{
    $guardian = Profile::factory()->create(['full_name' => $name, 'phone' => $phone]);

    // Each guardian gets a student of their own: only one link per student may be the
    // primary contact, so reusing one student across several guardians would collide
    // with the partial unique index rather than test anything.
    StudentProfile::factory()->create()->guardianLinks()->create([
        'guardian_profile_id' => $guardian->id,
        'relationship' => GuardianRelationship::Mother,
        'is_primary' => true,
    ]);

    return $guardian;
}

test('the guardian picker lists only the guardians already on file', function () {
    guardianOnFile('Nguyễn Thị Thu Hà', '0911111111');

    // A profile with no guardian link of its own: on file as a person, but not as
    // anybody's guardian, so a guardian picker must not offer it.
    Profile::factory()->create(['full_name' => 'Hoàng Văn Chưa Là Phụ Huynh']);

    $response = $this->getJson('/api/v1/guardians/options')->assertOk();

    expect($response->json('data'))->toHaveCount(1);
    $response
        ->assertJsonPath('data.0.label', 'Nguyễn Thị Thu Hà')
        ->assertJsonPath('data.0.phone', '0911111111');
});

test('the guardian picker never offers a profile that holds a student role', function () {
    $sibling = StudentProfile::factory()->create();
    $student = StudentProfile::factory()->create();

    // A student recorded as somebody's guardian would be a data error, but the picker
    // must not surface it even so: a student may never be another student's guardian.
    $student->guardianLinks()->create([
        'guardian_profile_id' => $sibling->profile_id,
        'relationship' => GuardianRelationship::Guardian,
        'is_primary' => true,
    ]);

    $this->getJson('/api/v1/guardians/options')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('the guardian picker matches a typed name or phone number', function () {
    guardianOnFile('Nguyễn Thị Thu Hà', '0911111111');
    guardianOnFile('Trần Văn Hùng', '0922222222');

    $this->getJson('/api/v1/guardians/options?q=Hùng')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Trần Văn Hùng');

    $this->getJson('/api/v1/guardians/options?q=0911')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Nguyễn Thị Thu Hà');

    $this->getJson('/api/v1/guardians/options?q=Không có ai tên này')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('the guardian picker finds a name typed without its tone marks', function (string $term) {
    guardianOnFile('Nguyễn Văn Hùng', '0911111111');

    $this->getJson('/api/v1/guardians/options?q='.urlencode($term))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Nguyễn Văn Hùng');
})->with([
    'Hung',      // the whole point: no marks at all
    'Hùng',      // typed with marks, still matches
    'hung',      // case folding still applies on top
    'nguyen',    // a leading word, also unmarked
    'Văn Hùng',  // two words, mixed
]);

test('the guardian picker folds the Vietnamese letters a naive tone strip would miss', function () {
    guardianOnFile('Đỗ Thị Ước', '0933333333');

    // `Đ` is a distinct letter rather than `D` plus a mark, and `ươ` carries both a
    // horn and a tone; a translate() over the tone marks alone would drop these.
    $this->getJson('/api/v1/guardians/options?q=Do Thi Uoc')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.label', 'Đỗ Thị Ước');
});

test('the guardian picker orders by name and honours the requested limit', function () {
    guardianOnFile('Vũ Thị Cuối');
    guardianOnFile('An Văn Đầu');
    guardianOnFile('Bùi Thị Giữa');

    $this->getJson('/api/v1/guardians/options')
        ->assertOk()
        ->assertJsonPath('data.0.label', 'An Văn Đầu')
        ->assertJsonPath('data.1.label', 'Bùi Thị Giữa')
        ->assertJsonPath('data.2.label', 'Vũ Thị Cuối');

    $this->getJson('/api/v1/guardians/options?limit=2')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

test('a guardian search term treats a typed wildcard as a literal character', function () {
    guardianOnFile('Nguyễn Thị Thu Hà', '0911111111');

    // Without wildcard escaping this would match every guardian on file.
    $this->getJson('/api/v1/guardians/options?q=%')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

test('the guardian picker is closed to a caller without the permission', function (UserRole $role): void {
    $user = User::factory()->create(['role' => $role]);
    $this->withToken($user->createToken('test')->plainTextToken);

    $this->getJson('/api/v1/guardians/options')->assertForbidden();
})->with([UserRole::Teacher, UserRole::Student, UserRole::Guardian]);
