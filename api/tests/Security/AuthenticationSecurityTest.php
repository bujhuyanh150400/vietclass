<?php

use App\Modules\Identity\Models\User;

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

test('it allows credentialed CORS only for an allowlisted origin', function () {
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

    // A browser sends the session cookie cross-origin only when both headers are
    // present, and the origin must be echoed exactly rather than as a wildcard.
    $allowed->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://app.vietclass.test:3000')
        ->assertHeader('Access-Control-Allow-Credentials', 'true');

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

test('it issues an HttpOnly session cookie that authenticates without the Authorization header', function () {
    User::factory()->withProfile()->create([
        'username' => 'cookie_user',
        'password' => 'password',
    ]);

    $login = $this->postJson('/api/v1/auth/login', [
        'username' => 'cookie_user',
        'password' => 'password',
    ])->assertOk();

    $cookieName = (string) config('identity.session_cookie');
    $token = $login->json('data.token');

    $login->assertPlainCookie($cookieName, $token);

    $cookie = $login->getCookie($cookieName, false);

    expect($cookie->isHttpOnly())->toBeTrue()
        ->and($cookie->getSameSite())->toBe('lax');

    // withCredentials() is what a browser does for a same-origin call; without it the
    // request carries no cookies at all, exactly as a cross-origin fetch would not.
    $this->withCredentials()
        ->withUnencryptedCookie($cookieName, $token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.username', 'cookie_user');
});

test('it clears the session cookie on logout and the revoked token stops working', function () {
    User::factory()->withProfile()->create([
        'username' => 'logout_user',
        'password' => 'password',
    ]);

    $cookieName = (string) config('identity.session_cookie');
    $token = $this->postJson('/api/v1/auth/login', [
        'username' => 'logout_user',
        'password' => 'password',
    ])->assertOk()->json('data.token');

    $logout = $this->withCredentials()
        ->withUnencryptedCookie($cookieName, $token)
        ->deleteJson('/api/v1/auth/logout')
        ->assertNoContent();

    expect($logout->getCookie($cookieName, false)->getValue())->toBeEmpty();

    // A resolved guard is cached for the lifetime of the test application, so it has to be
    // dropped for the next call to re-authenticate the way a separate request would.
    $this->app['auth']->forgetGuards();

    $this->withCredentials()
        ->withUnencryptedCookie($cookieName, $token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

test('it prefers the Authorization header over the session cookie', function () {
    $headerUser = User::factory()->withProfile()->create(['username' => 'header_user']);
    $cookieUser = User::factory()->withProfile()->create(['username' => 'cookie_owner']);

    $this->withCredentials()
        ->withUnencryptedCookie(
            (string) config('identity.session_cookie'),
            $cookieUser->createToken('cookie')->plainTextToken,
        )
        ->withToken($headerUser->createToken('header')->plainTextToken)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.username', 'header_user');
});
