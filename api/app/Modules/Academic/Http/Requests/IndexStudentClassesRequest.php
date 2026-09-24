<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class IndexStudentClassesRequest extends FormRequest
{
    use PaginatesQuery;

    /** Historical class membership is available to administrators only. */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /** Validate pagination and supported class ordering. */
    public function rules(): array
    {
        return $this->paginationRules();
    }

    /** Allow sorting the classes a student has attended. */
    protected function sortableColumns(): array
    {
        return ['id', 'code', 'name', 'grade_level', 'created_at'];
    }
}
