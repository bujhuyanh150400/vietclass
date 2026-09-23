<?php

namespace App\Modules\Academic\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DeleteGuardianRequest extends FormRequest
{
    /** Allow the route capability middleware to own authorization. */
    public function authorize(): bool
    {
        return true;
    }

    /** Define replacement guardian ids keyed by affected student profile id. */
    public function rules(): array
    {
        return [
            'replacements' => ['sometimes', 'array'],
            'replacements.*' => ['required', 'integer', 'min:1'],
        ];
    }
}
