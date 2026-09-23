<?php

namespace App\Modules\Academic\Http\Requests;

final class UpdateGuardianRequest extends StoreGuardianRequest
{
    /** Accept explicit replacements when this guardian loses primary responsibility. */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'replacements' => ['sometimes', 'array'],
            'replacements.*' => ['required', 'integer', 'min:1'],
        ];
    }
}
