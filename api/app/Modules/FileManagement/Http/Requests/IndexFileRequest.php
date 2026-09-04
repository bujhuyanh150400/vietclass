<?php

namespace App\Modules\FileManagement\Http\Requests;

use App\Core\Data\ListQuery;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexFileRequest extends FormRequest
{
    /** Allow list authorization to remain owned by the route feature middleware. */
    public function authorize(): bool
    {
        return true;
    }

    /** Validate only the explicit file-library metadata filters and sort fields. */
    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'category' => ['sometimes', 'string', Rule::in(['image', 'pdf', 'document', 'spreadsheet', 'presentation', 'text'])],
            'owner_user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                Rule::prohibitedIf(fn (): bool => $this->user()?->role !== UserRole::Admin),
            ],
            'uploaded_from' => ['sometimes', 'date_format:Y-m-d', 'before_or_equal:uploaded_to'],
            'uploaded_to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:uploaded_from'],
            'trash' => ['sometimes', 'string', Rule::in(['active', 'trashed'])],
            'link_type' => ['sometimes', 'integer', Rule::enum(FileLinkType::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'sort' => ['sometimes', 'string', Rule::in(['id', 'original_name', 'display_name', 'size_bytes', 'created_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    /** Convert the file-specific search key and validated filters into the shared query value. */
    public function toListQuery(): ListQuery
    {
        $validated = $this->validated();
        $search = trim((string) ($validated['search'] ?? ''));
        $filters = ['trash' => $validated['trash'] ?? 'active'];

        foreach (['category', 'owner_user_id', 'uploaded_from', 'uploaded_to', 'link_type'] as $key) {
            if (isset($validated[$key])) {
                $filters[$key] = $validated[$key];
            }
        }

        return new ListQuery(
            page: (int) ($validated['page'] ?? 1),
            perPage: (int) ($validated['per_page'] ?? 20),
            search: $search === '' ? null : $search,
            sort: (string) ($validated['sort'] ?? 'created_at'),
            direction: (string) ($validated['direction'] ?? 'desc'),
            filters: $filters,
        );
    }
}
