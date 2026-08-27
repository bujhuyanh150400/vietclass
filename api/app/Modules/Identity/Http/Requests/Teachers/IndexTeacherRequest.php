<?php

namespace App\Modules\Identity\Http\Requests\Teachers;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Identity\Enums\EmployeeStatus;
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
            'status.*' => ['integer', Rule::in(EmployeeStatus::values())],
            'is_active' => ['sometimes', 'boolean'],
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
        return ['status', 'is_active'];
    }
}
