<?php

namespace Tests\Support;

use LogicException;

trait EnsuresTestingDatabase
{
    /**
     * Stops the suite before it can migrate or write to a non-test database.
     */
    public function assertTestingDatabaseIsSafe(): void
    {
        $connection = config('database.default');
        $database = config('database.connections.pgsql.database');

        if ($connection !== 'pgsql' || $database !== 'api_testing') {
            throw new LogicException('Tests must use the dedicated PostgreSQL database api_testing.');
        }
    }
}
