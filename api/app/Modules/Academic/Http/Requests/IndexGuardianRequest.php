<?php

namespace App\Modules\Academic\Http\Requests;

use App\Core\Http\Requests\Concerns\PaginatesQuery;
use Illuminate\Foundation\Http\FormRequest;

final class IndexGuardianRequest extends FormRequest
{
    use PaginatesQuery;

    /** Allow the route capability middleware to own authorization. */
    public function authorize(): bool
    {
        return true;
    }

    /** Define the guardian list query contract. */
    public function rules(): array
    {
        return $this->paginationRules();
    }

    /** Return sortable guardian columns. */
    protected function sortableColumns(): array
    {
        return ['id', 'full_name', 'created_at'];
    }
}
