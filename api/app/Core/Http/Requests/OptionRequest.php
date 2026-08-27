<?php

namespace App\Core\Http\Requests;

use App\Core\Data\ListQuery;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The query contract shared by every combobox endpoint: a search term and a cap on how
 * many suggestions come back.
 */
final class OptionRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may reach this list.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted option-list query string.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    /**
     * Convert the validated query string into the value the repository reads, reusing
     * the shared search escaping so a typed `%` cannot widen the match.
     */
    public function toListQuery(): ListQuery
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        $search = trim((string) ($validated['q'] ?? ''));

        return new ListQuery(
            perPage: (int) ($validated['limit'] ?? 20),
            search: $search === '' ? null : $search,
        );
    }
}
