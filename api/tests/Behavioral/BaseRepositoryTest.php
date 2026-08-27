<?php

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;

/**
 * Builds a throwaway BaseRepository whose modelClass()/table() declarations are
 * fixed by the caller, so each test can drive modelQuery()/tableQuery() directly.
 */
function makeBaseRepositoryDouble(?string $modelClass, ?string $table): BaseRepository
{
    return new class($modelClass, $table) extends BaseRepository
    {
        public function __construct(
            private readonly ?string $modelClassOverride,
            private readonly ?string $tableOverride,
        ) {}

        protected function modelClass(): ?string
        {
            return $this->modelClassOverride;
        }

        protected function table(): ?string
        {
            return $this->tableOverride;
        }

        public function callModelQuery(): Builder
        {
            return $this->modelQuery();
        }

        public function callTableQuery(): QueryBuilder
        {
            return $this->tableQuery();
        }
    };
}

test('modelQuery starts an Eloquent query against the declared model', function (): void {
    $repository = makeBaseRepositoryDouble(User::class, null);

    $query = $repository->callModelQuery();

    expect($query)->toBeInstanceOf(Builder::class)
        ->and($query->getModel())->toBeInstanceOf(User::class);
});

test('modelQuery refuses to start a query when no model is declared', function (): void {
    $repository = makeBaseRepositoryDouble(null, 'users');

    $repository->callModelQuery();
})->throws(LogicException::class);

test('tableQuery starts a query builder query against the declared table', function (): void {
    $repository = makeBaseRepositoryDouble(null, 'users');

    $query = $repository->callTableQuery();

    expect($query)->toBeInstanceOf(QueryBuilder::class)
        ->and($query->from)->toBe('users');
});

test('tableQuery refuses to start a query when no table is declared', function (): void {
    $repository = makeBaseRepositoryDouble(User::class, null);

    $repository->callTableQuery();
})->throws(LogicException::class);
