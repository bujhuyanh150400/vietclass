<?php

namespace App\Modules\FileManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class GetFileContentRequest extends FormRequest
{
    /** Allow content authorization to remain owned by the route feature and Action visibility. */
    public function authorize(): bool
    {
        return true;
    }

    /** Validate the optional download override as a boolean query value. */
    public function rules(): array
    {
        return [
            'download' => ['sometimes', 'boolean'],
        ];
    }
}
