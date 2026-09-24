<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class IndexEnrollmentStudentOptionsRequest extends FormRequest
{
    use PaginatesQuery;

    /** Student choices include class history, so restrict the projection to admins. */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /** Validate search and paging for the enrollment picker. */
    public function rules(): array
    {
        return $this->paginationRules();
    }

    /** Allow predictable ordering for a student candidate list. */
    protected function sortableColumns(): array
    {
        return ['id', 'full_name', 'grade_level'];
    }

    /** Use full name as the default visible ordering. */
    protected function defaultSort(): string
    {
        return 'full_name';
    }
}
