<?php

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Illuminate\Support\Facades\DB;

test('missing quota setting returns the fixed defaults', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($admin->createToken('test')->plainTextToken)->getJson('/api/v1/system/file-quotas')
        ->assertOk()
        ->assertExactJson([
            'data' => [
                'quotas' => [
                    'admin' => 10_737_418_240,
                    'teacher' => 2_147_483_648,
                    'student' => 524_288_000,
                    'guardian' => 524_288_000,
                ],
            ],
        ]);
});

test('an administrator updates every quota and records the actor', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $quotas = [
        'admin' => 100,
        'teacher' => 200,
        'student' => 300,
        'guardian' => 400,
    ];

    $this->withToken($admin->createToken('test')->plainTextToken)
        ->putJson('/api/v1/system/file-quotas', ['quotas' => $quotas])
        ->assertOk()
        ->assertExactJson(['data' => ['quotas' => $quotas]]);

    $setting = DB::table('system_settings')->where('key', 'file_storage.quotas')->first();

    expect($setting)->not->toBeNull()
        ->and($setting->updated_by)->toBe($admin->id)
        ->and(json_decode($setting->value, associative: true, flags: JSON_THROW_ON_ERROR))
        ->toEqualCanonicalizing($quotas);
});

test('file quota updates require exactly four nonnegative integer quotas', function (array $quotas, string $error): void {
    $admin = User::factory()->create(['role' => UserRole::Admin]);

    $this->withToken($admin->createToken('test')->plainTextToken)
        ->putJson('/api/v1/system/file-quotas', ['quotas' => $quotas])
        ->assertUnprocessable()
        ->assertJsonValidationErrors($error);
})->with([
    'missing role' => [[
        'admin' => 1,
        'teacher' => 1,
        'student' => 1,
    ], 'quotas.guardian'],
    'unexpected role' => [[
        'admin' => 1,
        'teacher' => 1,
        'student' => 1,
        'guardian' => 1,
        'staff' => 1,
    ], 'quotas'],
    'negative value' => [[
        'admin' => -1,
        'teacher' => 1,
        'student' => 1,
        'guardian' => 1,
    ], 'quotas.admin'],
    'non-integer value' => [[
        'admin' => '1',
        'teacher' => 1,
        'student' => 1,
        'guardian' => 1,
    ], 'quotas.admin'],
]);
