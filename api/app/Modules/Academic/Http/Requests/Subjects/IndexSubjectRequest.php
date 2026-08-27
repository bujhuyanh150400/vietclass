<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use Illuminate\Foundation\Http\FormRequest;

final class IndexSubjectRequest extends FormRequest
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
     * Define the accepted subject list query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Return the columns a caller may sort subjects by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'name', 'created_at'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['is_active'];
    }
}
