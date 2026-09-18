<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Academic\Enums\TeacherStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexTeacherRequest extends FormRequest
{
    use PaginatesQuery;

    /**
     * Allow the request; route middleware already decided who may reach this list.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted teacher list query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'status' => ['sometimes', 'array'],
            'status.*' => ['integer', Rule::in(TeacherStatus::values())],
            'is_active' => ['sometimes', 'boolean'],
            'subject_id' => ['sometimes', 'array'],
            'subject_id.*' => ['integer', 'min:1'],
            'class_id' => ['sometimes', 'array'],
            'class_id.*' => ['integer', 'min:1'],
            'joined_from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'joined_to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:joined_from'],
        ];
    }

    /**
     * Return the columns a caller may sort teachers by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'full_name', 'joined_at', 'created_at'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['status', 'is_active', 'subject_id', 'class_id', 'joined_from', 'joined_to'];
    }
}
