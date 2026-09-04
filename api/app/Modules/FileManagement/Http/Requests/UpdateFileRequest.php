<?php

namespace App\Modules\FileManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateFileRequest extends FormRequest
{
    /** Allow rename authorization to remain owned by the route feature and Action visibility. */
    public function authorize(): bool
    {
        return true;
    }

    /** Accept only a non-empty display name and explicitly reject storage or ownership coordinates. */
    public function rules(): array
    {
        return [
            'display_name' => ['required', 'string', 'max:255'],
            'owner_user_id' => ['prohibited'],
            'disk' => ['prohibited'],
            'path' => ['prohibited'],
        ];
    }
}
