<?php

namespace App\Modules\FileManagement\Http\Requests;

use App\Modules\FileManagement\Rules\ManagedFileUpload;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreFileRequest extends FormRequest
{
    /** Allow upload authorization to remain owned by the route feature middleware. */
    public function authorize(): bool
    {
        return true;
    }

    /** Validate the upload metadata and prevent non-administrators selecting an owner. */
    public function rules(): array
    {
        return [
            'file' => ['required', new ManagedFileUpload],
            'display_name' => ['sometimes', 'nullable', 'string', 'max:255'],
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
