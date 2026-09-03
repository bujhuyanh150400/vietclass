<?php

namespace App\Core\Http\Requests\Concerns;

use App\Core\Data\ListQuery;
use Illuminate\Validation\Rule;

/**
 * Gives a list Form Request the query-string contract every paginated endpoint shares,
 * so paging, search, and sorting cannot drift apart between resources.
 */
trait PaginatesQuery
{
    /**
     * Return the columns a caller is allowed to sort this list by.
     *
     * @return list<string>
     */
    abstract protected function sortableColumns(): array;

    /**
     * Return the validation rules shared by every paginated list endpoint.
     *
     * @return array<string, array<int, mixed>>
     */
    protected function paginationRules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'sort' => ['sometimes', 'string', Rule::in($this->sortableColumns())],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    /**
     * Return the column this list falls back to when the caller names none.
     */
    protected function defaultSort(): string
    {
        return 'id';
    }

    /**
     * Return the filter parameters this list accepts, which are the only validated
     * keys carried through to the repository.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return [];
    }

    /**
     * Convert the validated query string into the transport-free value a repository reads.
     */
    public function toListQuery(): ListQuery
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        $search = trim((string) ($validated['q'] ?? ''));
        $filters = [];

        foreach ($this->filterKeys() as $key) {
            if (isset($validated[$key])) {
                $filters[$key] = $validated[$key];
            }
        }

        return new ListQuery(
            page: (int) ($validated['page'] ?? 1),
            perPage: (int) ($validated['per_page'] ?? 20),
            search: $search === '' ? null : $search,
            sort: (string) ($validated['sort'] ?? $this->defaultSort()),
            // Rows have no meaningful order without an explicit one, and the newest
            // record is the one a caller most often wants first.
            direction: (string) ($validated['direction'] ?? 'desc'),
            filters: $filters,
        );
    }
}
