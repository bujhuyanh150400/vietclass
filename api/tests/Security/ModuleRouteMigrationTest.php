<?php

dataset('target module routes', [
    'auth current user' => ['getJson', '/api/v1/auth/me'],
    'academic teachers' => ['getJson', '/api/v1/academic/teachers'],
    'academic students' => ['getJson', '/api/v1/academic/students'],
    'academic guardian options' => ['getJson', '/api/v1/academic/guardians/options'],
    'academic avatar' => ['putJson', '/api/v1/academic/profiles/1/avatar'],
    'academic subjects' => ['getJson', '/api/v1/academic/subjects'],
    'academic classes' => ['getJson', '/api/v1/academic/classes'],
    'academic enrollments' => ['putJson', '/api/v1/academic/enrollments/1'],
    'academic rooms' => ['getJson', '/api/v1/academic/rooms'],
    'system files' => ['getJson', '/api/v1/system/files'],
    'system file quotas' => ['getJson', '/api/v1/system/settings/file-quotas'],
]);

test('target module routes require authentication', function (string $method, string $uri): void {
    $this->{$method}($uri)->assertUnauthorized();
})->with('target module routes');

dataset('removed module routes', [
    'teachers' => ['getJson', '/api/v1/teachers'],
    'students' => ['getJson', '/api/v1/students'],
    'guardian options' => ['getJson', '/api/v1/guardians/options'],
    'avatar' => ['putJson', '/api/v1/profiles/1/avatar'],
    'subjects' => ['getJson', '/api/v1/subjects'],
    'classes' => ['getJson', '/api/v1/classes'],
    'enrollments' => ['putJson', '/api/v1/enrollments/1'],
    'rooms' => ['getJson', '/api/v1/rooms'],
    'files' => ['getJson', '/api/v1/files'],
    'file quotas' => ['getJson', '/api/v1/system/file-quotas'],
]);

test('removed module routes have no compatibility aliases', function (string $method, string $uri): void {
    $this->{$method}($uri)->assertNotFound();
})->with('removed module routes');
