<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Identity\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'grade_level' => ['sometimes', 'integer', Rule::in(GradeLevel::values())],
        ];
    }

    /**
     * Return the columns a caller may sort subjects by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'name', 'created_at', 'active_classes_count'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['is_active', 'grade_level'];
    }
}
