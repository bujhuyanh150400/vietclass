<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class IndexTransferOptionsRequest extends FormRequest
{
    use PaginatesQuery;

    /** Transfer eligibility details are limited to administrators as specified for this projection. */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /** Validate search and paging for transfer targets. */
    public function rules(): array
    {
        return $this->paginationRules();
    }

    /** Allow predictable ordering for the class picker. */
    protected function sortableColumns(): array
    {
        return ['id', 'code', 'name', 'max_students'];
    }

    /** Use class code as the default stable sort key. */
    protected function defaultSort(): string
    {
        return 'code';
    }
}
