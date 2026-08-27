<?php

namespace App\Modules\Academic\Http\Requests\Enrollments;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use Illuminate\Foundation\Http\FormRequest;

final class IndexEnrollmentRequest extends FormRequest
{
    use PaginatesQuery;

    /**
     * Allow the request; route middleware already decided who may reach this roster.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted roster query string.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            ...$this->paginationRules(),
            'active_only' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Return the columns a caller may sort a roster by.
     *
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return ['id', 'enrolled_at', 'left_at'];
    }

    /**
     * Return the filters this roster accepts.
     *
     * @return list<string>
     */
    protected function filterKeys(): array
    {
        return ['active_only'];
    }
}
