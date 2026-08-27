<?php

namespace App\Modules\Identity\Http\Requests\Students;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexStudentRequest extends FormRequest
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
     * Define the accepted student list query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'status' => ['sometimes', 'array'],
            'status.*' => ['integer', Rule::in(StudentStatus::values())],
            'grade_level' => ['sometimes', 'array'],
            'grade_level.*' => ['integer', Rule::in(GradeLevel::values())],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Return the columns a caller may sort students by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'full_name', 'grade_level', 'created_at'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['status', 'grade_level', 'is_active'];
    }
}
