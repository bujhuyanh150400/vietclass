<?php

use App\Modules\Auth\Models\User;

test('it returns one generic unauthorized response for bad credentials and inactive users', function () {
    User::factory()->create([
        'username' => 'inactive_user',
        'password' => 'password',
        'is_active' => false,
    ]);

    $incorrectPassword = $this->postJson('/api/v1/auth/login', [
        'username' => 'missing_user',
        'password' => 'wrong-password',
    ]);
    $inactiveUser = $this->postJson('/api/v1/auth/login', [
        'username' => 'inactive_user',
        'password' => 'password',
    ]);

    $incorrectPassword->assertUnauthorized()
        ->assertExactJson([
            'message' => 'Thông tin đăng nhập không chính xác.',
        ]);
    $inactiveUser->assertUnauthorized()
        ->assertExactJson([
            'message' => 'Thông tin đăng nhập không chính xác.',
        ]);
});

test('it rate limits repeated login attempts', function () {
    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'rate_limited_user',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', [
        'username' => 'rate_limited_user',
        'password' => 'wrong-password',
    ])->assertTooManyRequests();
});

test('it allows Bearer CORS only for an allowlisted origin', function () {
    // Two origins on purpose: with a single one configured, php-cors echoes it back
    // unconditionally and leaves the rejection to the browser, so the allowlist
    // matching itself would never be exercised.
    config(['cors.allowed_origins' => [
        'https://vietclass.vn',
        'http://app.vietclass.test:3000',
    ]]);

    $allowed = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
        'HTTP_ORIGIN' => 'http://app.vietclass.test:3000',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    // The origin must be echoed exactly rather than as a wildcard; credentials are
    // deliberately disabled because all authenticated calls use Authorization.
    $allowed->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://app.vietclass.test:3000');

    expect($allowed->headers->get('Access-Control-Allow-Credentials'))->toBeNull();

    $foreign = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
        'HTTP_ORIGIN' => 'https://attacker.example',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    expect($foreign->headers->get('Access-Control-Allow-Origin'))->toBeNull();
});

test('it rejects expired tokens and never exposes passwords or token hashes', function () {
    $user = User::factory()->withProfile()->create([
        'password' => 'password',
    ]);
    $expiredToken = $user->createToken('expired', ['*'], now()->subMinute());
    $activeToken = $user->createToken('active');

    $this->withToken($expiredToken->plainTextToken)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();

    $this->withToken($activeToken->plainTextToken)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.token');

    $this->assertDatabaseMissing('personal_access_tokens', [
        'token' => $activeToken->plainTextToken,
    ]);
});

test('it returns a bearer token without issuing an API-domain session cookie', function () {
    User::factory()->withProfile()->create([
        'username' => 'bearer_user',
        'password' => 'password',
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'username' => 'bearer_user',
        'password' => 'password',
    ])->assertOk();

    $token = $login->json('data.token');

    expect($token)->toBeString()->not->toBeEmpty();
    expect($login->headers->getCookies())->toBeEmpty();

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.username', 'bearer_user');
});

test('it revokes only the bearer token used to log out', function () {
    $user = User::factory()->withProfile()->create([
        'username' => 'logout_user',
        'password' => 'password',
    ]);
    $token = $user->createToken('logout')->plainTextToken;

    $this->withToken($token)
        ->deleteJson('/api/v1/auth/logout')
        ->assertNoContent();

    // A resolved guard is cached for the lifetime of the test application, so it has to be
    // dropped for the next call to re-authenticate the way a separate request would.
    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});
