<?php

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\User;

dataset('file quota endpoints', [
    'view' => ['getJson', '/api/v1/system/file-quotas'],
    'update' => ['putJson', '/api/v1/system/file-quotas'],
]);

test('a file quota endpoint refuses a request with no bearer token', function (string $method, string $uri): void {
    $this->{$method}($uri)
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Chưa xác thực.']);
})->with('file quota endpoints');

test('non administrators cannot manage file quotas', function (UserRole $role, string $method, string $uri): void {
    $user = User::factory()->create(['role' => $role]);

    $this->withToken($user->createToken('test')->plainTextToken)
        ->{$method}($uri, ['quotas' => []])
        ->assertForbidden()
        ->assertExactJson(['message' => 'Bạn không có quyền thực hiện thao tác này.']);
})->with([
    'teacher' => UserRole::Teacher,
    'student' => UserRole::Student,
    'guardian' => UserRole::Guardian,
])->with('file quota endpoints');
