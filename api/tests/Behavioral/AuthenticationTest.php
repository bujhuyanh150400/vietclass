<?php

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Auth\Actions\LoginAction;
use App\Modules\Auth\Actions\LogoutAction;
use App\Modules\Auth\Enums\AuthError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

test('login action returns a business failure result for invalid credentials', function () {
    $result = app(LoginAction::class)->handle([
        'username' => 'missing_user',
        'password' => 'wrong-password',
    ]);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(AuthError::InvalidCredentials)
        ->and($result->getMessage())->toBe('Thông tin đăng nhập không chính xác.');
});

test('login action converts a known action error into a failure result', function () {
    User::factory()->create([
        'username' => 'action_error_user',
        'password' => 'password',
    ]);

    Hash::shouldReceive('check')->once()->andThrow(new ActionError(
        message: 'Thông tin đăng nhập không chính xác.',
        code: AuthError::InvalidCredentials,
    ));

    $result = app(LoginAction::class)->handle([
        'username' => 'action_error_user',
        'password' => 'password',
    ]);

    expect($result->isSuccess())->toBeFalse()
        ->and($result->getError())->toBe(AuthError::InvalidCredentials)
        ->and($result->getMessage())->toBe('Thông tin đăng nhập không chính xác.');
});

test('login action does not convert unexpected exceptions into business failures', function () {
    User::factory()->create([
        'username' => 'system_error_user',
        'password' => 'password',
    ]);

    Hash::shouldReceive('check')->once()->andThrow(new RuntimeException('database unavailable'));

    expect(fn () => app(LoginAction::class)->handle([
        'username' => 'system_error_user',
        'password' => 'password',
    ]))->toThrow(RuntimeException::class, 'database unavailable');
});

test('login action returns a success result with its application data', function () {
    $user = User::factory()->create([
        'username' => 'teacher_action',
        'password' => 'password',
    ]);

    $result = app(LoginAction::class)->handle([
        'username' => 'teacher_action',
        'password' => 'password',
    ]);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeTrue()
        ->and($result->getData()['user']->is($user))->toBeTrue()
        ->and($result->getData()['token']->plainTextToken)->not->toBeEmpty();
});

test('logout action returns a success result after revoking the current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('logout-action');
    $user->withAccessToken($token->accessToken);

    $result = app(LogoutAction::class)->handle($user);

    expect($result)
        ->toBeInstanceOf(ActionResult::class)
        ->and($result->isSuccess())->toBeTrue();

    $this->assertDatabaseMissing('personal_access_tokens', [
        'id' => $token->accessToken->id,
    ]);
});

test('it logs in with a bearer token and returns the current user', function () {
    $user = User::factory()->create([
        'username' => 'teacher_one',
        'password' => 'password',
        'role' => UserRole::Teacher,
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'username' => 'teacher_one',
        'password' => 'password',
    ]);

    $login->assertOk()
        ->assertJsonPath('data.token_type', 'Bearer')
        ->assertJsonPath('data.user.id', $user->id)
        ->assertJsonPath('data.user.username', 'teacher_one')
        ->assertJsonPath('data.user.role', UserRole::Teacher->value)
        ->assertJsonPath('data.user.is_active', true);

    $this->withToken($login->json('data.token'))
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id)
        ->assertJsonPath('data.username', 'teacher_one');
});

test('it issues normal and remembered tokens with their configured lifetimes', function () {
    Carbon::setTestNow('2026-08-25 10:00:00 UTC');

    try {
        User::factory()->create([
            'username' => 'admin_one',
            'password' => 'password',
        ]);

        $normal = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin_one',
            'password' => 'password',
            'remember' => false,
        ]);
        $remembered = $this->postJson('/api/v1/auth/login', [
            'username' => 'admin_one',
            'password' => 'password',
            'remember' => true,
        ]);

        expect(Carbon::parse($normal->json('data.expires_at'))->equalTo(now()->addDays(30)))->toBeTrue()
            ->and(Carbon::parse($remembered->json('data.expires_at'))->equalTo(now()->addDays(120)))->toBeTrue();
    } finally {
        Carbon::setTestNow();
    }
});

test('it revokes only the bearer token used to log out', function () {
    $user = User::factory()->create();
    $firstToken = $user->createToken('first');
    $secondToken = $user->createToken('second');

    $this->withToken($firstToken->plainTextToken)
        ->deleteJson('/api/v1/auth/logout')
        ->assertNoContent();

    $this->assertDatabaseMissing('personal_access_tokens', [
        'id' => $firstToken->accessToken->id,
    ])->assertDatabaseHas('personal_access_tokens', [
        'id' => $secondToken->accessToken->id,
    ]);

    $this->app['auth']->forgetGuards();

    $this->withToken($firstToken->plainTextToken)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();

    $this->app['auth']->forgetGuards();

    $this->withToken($secondToken->plainTextToken)
        ->getJson('/api/v1/auth/me')
        ->assertOk();
});
