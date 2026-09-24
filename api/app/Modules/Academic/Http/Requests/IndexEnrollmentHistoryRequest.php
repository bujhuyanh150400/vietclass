<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use App\Modules\Auth\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class IndexEnrollmentHistoryRequest extends FormRequest
{
    use PaginatesQuery;

    /** Only administrators may read student enrollment history. */
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::Admin;
    }

    /** Validate the required class filter and stable timeline paging contract. */
    public function rules(): array
    {
        $rules = $this->paginationRules();
        $rules['per_page'] = ['sometimes', 'integer', 'min:1', 'max:100'];

        return [
            ...$rules,
            'class_id' => ['required', 'integer', 'min:1'],
        ];
    }

    /** Allow the supported event timeline sort columns. */
    protected function sortableColumns(): array
    {
        return ['effective_on', 'created_at', 'id'];
    }

    /** Start with the newest effective change. */
    protected function defaultSort(): string
    {
        return 'effective_on';
    }
}
