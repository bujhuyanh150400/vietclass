<?php

namespace App\Core\Data;

/**
 * Carries the already-validated shape of one list request — paging, search, sort, and
 * filters — so repositories can build a query without touching an HTTP request.
 */
final readonly class ListQuery
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        public int $page = 1,
        public int $perPage = 20,
        public ?string $search = null,
        public string $sort = 'id',
        public string $direction = 'desc',
        public array $filters = [],
    ) {}

    /**
     * Return one filter value, or null when the request did not supply it.
     */
    public function filter(string $key): mixed
    {
        return $this->filters[$key] ?? null;
    }

    /**
     * Report whether the request supplied a value for one filter.
     */
    public function hasFilter(string $key): bool
    {
        return array_key_exists($key, $this->filters);
    }

    /**
     * Report whether the request asked for a text search.
     */
    public function hasSearch(): bool
    {
        return $this->search !== null && $this->search !== '';
    }

    /**
     * Return the search term wrapped for a LIKE comparison, with wildcards escaped so
     * a literal `%` or `_` a caller typed matches itself instead of every row.
     */
    public function searchLike(): ?string
    {
        if (! $this->hasSearch()) {
            return null;
        }

        $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], (string) $this->search);

        return "%{$escaped}%";
    }
}
