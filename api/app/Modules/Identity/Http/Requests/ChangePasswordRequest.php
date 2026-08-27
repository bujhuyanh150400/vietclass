<?php

namespace App\Modules\Identity\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The payload shared by every endpoint that replaces a profile's account password.
 */
final class ChangePasswordRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may reset a password.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated password payload.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'string', 'min:8', 'max:255'],
        ];
    }
}
