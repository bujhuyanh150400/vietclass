<?php

namespace App\Core\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Base for module repositories: each concrete repository declares whichever data
 * source backs it — an Eloquent model or a raw DB table — and this class exposes
 * the matching query-builder starting point so repository methods don't repeat
 * that wiring.
 */
abstract class BaseRepository
{
    /**
     * The Eloquent model class this repository queries, or null when it is
     * backed by a raw DB table instead.
     */
    abstract protected function modelClass(): ?string;

    /**
     * The DB table name this repository queries directly, or null when it is
     * backed by an Eloquent model instead.
     */
    abstract protected function table(): ?string;

    /**
     * Starts an Eloquent query against this repository's declared model.
     */
    protected function modelQuery(): Builder
    {
        $modelClass = $this->modelClass()
            ?? throw new LogicException(static::class.' must return a model class from modelClass() to use modelQuery().');

        return $modelClass::query();
    }

    /**
     * Starts a query builder query against this repository's declared table.
     */
    protected function tableQuery(): QueryBuilder
    {
        $table = $this->table()
            ?? throw new LogicException(static::class.' must return a table name from table() to use tableQuery().');

        return DB::table($table);
    }
}
