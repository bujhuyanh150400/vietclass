<?php

namespace App\Modules\Academic\Http\Requests\Classes;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Identity\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class IndexClassRequest extends FormRequest
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
     * Define the accepted class list query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'status' => ['sometimes', 'array'],
            'status.*' => ['integer', Rule::in(ClassStatus::values())],
            'subject_id' => ['sometimes', 'array'],
            'subject_id.*' => ['integer', 'min:1'],
            'teacher_id' => ['sometimes', 'array'],
            'teacher_id.*' => ['integer', 'min:1'],
            'grade_level' => ['sometimes', 'array'],
            'grade_level.*' => ['integer', Rule::in(GradeLevel::values())],
        ];
    }

    /**
     * Return the columns a caller may sort classes by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'code', 'name', 'start_at', 'created_at'];
    }

    /**
     * Return the filters this list accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['status', 'subject_id', 'teacher_id', 'grade_level'];
    }
}
