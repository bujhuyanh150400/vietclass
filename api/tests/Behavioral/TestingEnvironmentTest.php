<?php

test('uses the dedicated PostgreSQL testing database', function () {
    expect(config('database.default'))->toBe('pgsql')
        ->and(config('database.connections.pgsql.database'))->toBe('api_testing');
});
