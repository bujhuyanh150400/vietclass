<?php

namespace App\Modules\Identity\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The payload shared by every endpoint that locks or unlocks a login account.
 */
final class ToggleAccountRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may lock an account.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated account-state payload.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'is_active' => ['required', 'boolean'],
        ];
    }
}
