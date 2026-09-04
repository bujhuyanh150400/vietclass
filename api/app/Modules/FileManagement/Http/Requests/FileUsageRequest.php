<?php

namespace App\Modules\FileManagement\Http\Requests;

use App\Modules\Identity\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class FileUsageRequest extends FormRequest
{
    /** Allow usage authorization to remain owned by the route feature middleware. */
    public function authorize(): bool
    {
        return true;
    }

    /** Validate an optional administrator owner selection and prohibit it for other roles. */
    public function rules(): array
    {
        return [
            'owner_user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                Rule::prohibitedIf(fn (): bool => $this->user()?->role !== UserRole::Admin),
            ],
        ];
    }
}
