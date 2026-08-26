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

test('it exposes bearer API CORS without credentialed browser sessions', function () {
    $response = $this->call('OPTIONS', '/api/v1/auth/login', [], [], [], [
        'HTTP_ORIGIN' => 'http://localhost:3000',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
    ]);

    $response->assertNoContent()
        ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    expect($response->headers->has('Access-Control-Allow-Credentials'))->toBeFalse();
});

test('it rejects expired tokens and never exposes passwords or token hashes', function () {
    $user = User::factory()->create([
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
