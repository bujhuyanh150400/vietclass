<?php

namespace App\Modules\FileManagement\Http\Requests;

use App\Core\Data\ListQuery;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class FileOwnerOptionsRequest extends FormRequest
{
    /** Restrict owner selection to administrators before the controller runs. */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /** Reuse the shared option endpoint's search and bounded result-count contract. */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'nullable', 'string', 'max:100'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }

    /** Convert the option query string into the repository's shared query value. */
    public function toListQuery(): ListQuery
    {
        $validated = $this->validated();
        $search = trim((string) ($validated['q'] ?? ''));

        return new ListQuery(
            perPage: (int) ($validated['limit'] ?? 20),
            search: $search === '' ? null : $search,
        );
    }
}
