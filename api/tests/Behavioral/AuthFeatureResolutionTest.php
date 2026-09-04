<?php

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Auth\Models\Feature;
use App\Modules\Auth\Repositories\FeatureRepository;
use App\Modules\Auth\Support\FeatureRegistry;
use App\Modules\Auth\Support\FeatureResolver;
use App\Modules\FileManagement\Enums\FileManagementFeature;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Tests\Support\TestFeature;

beforeEach(function (): void {
    app(FeatureRegistry::class)->register(TestFeature::class);
    app(FeatureRepository::class)->upsertMany(app(FeatureRegistry::class)->all());
    app(FeatureResolver::class)->flush();
});

/**
 * Narrow a resolved permission set to this test's own declarations, so adding a
 * permission to a real module cannot break assertions about the fixture.
 *
 * @return list<string>
 */
function testingCodesFor(User $user): array
{
    return array_values(array_filter(
        app(FeatureResolver::class)->effectiveCodes($user),
        static fn (string $code): bool => str_starts_with($code, 'testing.'),
    ));
}

function overrideFeature(User $user, FeatureEnum $feature, bool $granted): void
{
    DB::table('feature_user')->insert([
        'user_id' => $user->id,
        'feature_id' => Feature::query()->where('code', $feature->value)->value('id'),
        'granted' => $granted,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    app(FeatureResolver::class)->flush();
}

test('a role holds exactly the permissions declared for it', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);
    $student = User::factory()->create(['role' => UserRole::Student]);

    expect(testingCodesFor($admin))
        ->toEqualCanonicalizing([TestFeature::AdminOnly->value, TestFeature::Shared->value])
        ->and(testingCodesFor($teacher))->toBe([TestFeature::Shared->value])
        ->and(testingCodesFor($student))->toBe([]);
});

test('the file features are granted to every active role', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);

    expect(app(FeatureResolver::class)->allows($user, FileManagementFeature::Upload))->toBeTrue();
})->with(UserRole::cases());

test('a granted override adds a permission the role does not carry', function () {
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    expect(app(FeatureResolver::class)->allows($teacher, TestFeature::AdminOnly))->toBeFalse();

    overrideFeature($teacher, TestFeature::AdminOnly, granted: true);

    expect(app(FeatureResolver::class)->allows($teacher, TestFeature::AdminOnly))->toBeTrue();
});

test('a denied override withdraws a permission the role does carry', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    expect(app(FeatureResolver::class)->allows($admin, TestFeature::AdminOnly))->toBeTrue();

    overrideFeature($admin, TestFeature::AdminOnly, granted: false);

    expect(app(FeatureResolver::class)->allows($admin, TestFeature::AdminOnly))->toBeFalse();
});

test('a deactivated account holds no permission at all', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin, 'is_active' => false]);

    overrideFeature($admin, TestFeature::Unassigned, granted: true);

    expect(app(FeatureResolver::class)->effectiveCodes($admin))->toBe([])
        ->and(testingCodesFor($admin))->toBe([]);
});

test('a catalogue row no module declares any more grants nothing', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $orphan = Feature::query()->create([
        'code' => 'removed_module.do_anything',
        'name' => 'Quyền của module đã gỡ',
        'group_code' => 'removed_module',
    ]);

    DB::table('feature_user')->insert([
        'user_id' => $admin->id,
        'feature_id' => $orphan->id,
        'granted' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    app(FeatureResolver::class)->flush();

    expect(app(FeatureResolver::class)->effectiveCodes($admin))
        ->not->toContain('removed_module.do_anything');
});

test('role defaults still resolve when the catalogue row is missing', function () {
    Feature::query()->where('code', TestFeature::AdminOnly->value)->delete();
    app(FeatureResolver::class)->flush();

    $admin = User::factory()->create(['role' => UserRole::Admin]);

    expect(app(FeatureResolver::class)->allows($admin, TestFeature::AdminOnly))->toBeTrue();
});

test('the gate answers declared abilities and ignores every other one', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    expect(Gate::forUser($admin)->allows(TestFeature::AdminOnly->value))->toBeTrue()
        ->and(Gate::forUser($admin)->allows(TestFeature::Unassigned->value))->toBeFalse()
        ->and(Gate::forUser($admin)->allows('an-ability-no-module-owns'))->toBeFalse();
});

test('the sync command is idempotent and reports codes no module declares', function () {
    Feature::query()->create([
        'code' => 'removed_module.do_anything',
        'name' => 'Quyền của module đã gỡ',
        'group_code' => 'removed_module',
    ]);

    $declared = count(app(FeatureRegistry::class)->all());

    $this->artisan('auth:sync-features')
        ->expectsOutputToContain("Đã đồng bộ {$declared} quyền.")
        ->expectsOutputToContain('removed_module.do_anything')
        ->assertSuccessful();

    $this->artisan('auth:sync-features')->assertSuccessful();

    expect(Feature::query()->where('code', TestFeature::AdminOnly->value)->count())->toBe(1)
        ->and(Feature::query()->where('code', 'removed_module.do_anything')->exists())->toBeTrue();
});

function registerGatedTestRoute(): string
{
    Route::middleware(['api', 'auth:sanctum', Authorize::using(TestFeature::AdminOnly)])
        ->get('/api/v1/testing/gate', fn () => response()->json(['data' => true]));

    return '/api/v1/testing/gate';
}

test('a permission-gated route serves a user who holds the permission', function () {
    $route = registerGatedTestRoute();
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($admin->createToken('test')->plainTextToken)
        ->getJson($route)
        ->assertOk()
        ->assertExactJson(['data' => true]);
});

test('a permission-gated route answers with the shared forbidden envelope', function () {
    $route = registerGatedTestRoute();
    $teacher = User::factory()->create(['role' => UserRole::Teacher]);

    $this->withToken($teacher->createToken('test')->plainTextToken)
        ->getJson($route)
        ->assertForbidden()
        ->assertExactJson(['message' => 'Bạn không có quyền thực hiện thao tác này.']);
});

test('a permission-gated route rejects a request with no bearer token', function () {
    $route = registerGatedTestRoute();

    $this->getJson($route)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Chưa xác thực.']);
});
