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

    /**
     * Match a typed search term against any of several columns, ignoring both letter
     * case and Vietnamese tone marks.
     *
     * A reader searching for "Nguyễn Văn Hùng" types "Hung", so folding only the stored
     * value is not enough — both sides go through `unaccent()`, which also lets a term
     * typed *with* its marks keep matching. The dictionary leaves `%` and `_` alone, so
     * the wildcard escaping `ListQuery::searchLike()` applied survives it.
     *
     * Every search in the application matches a term against a set of columns, so the
     * whole `OR` group is built here rather than one column at a time: it keeps the
     * group parenthesised, which is what stops a later `AND` filter from binding to the
     * last `OR` branch alone.
     *
     * Column names are interpolated into raw SQL, so they must be literals the caller
     * writes, never values that reached the application from a request.
     *
     * @param  list<string>  $columns
     */
    protected function whereAnyUnaccentedLike(Builder $builder, array $columns, string $pattern): Builder
    {
        return $builder->where(function (Builder $match) use ($columns, $pattern): void {
            foreach ($columns as $column) {
                $match->orWhereRaw("unaccent({$column}) ilike unaccent(?)", [$pattern]);
            }
        });
    }
}
