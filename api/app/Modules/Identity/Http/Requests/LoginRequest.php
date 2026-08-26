<?php

namespace App\Modules\Identity\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class LoginRequest extends FormRequest
{
    /**
     * Allow unauthenticated clients to submit login credentials.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated login payload.
     *
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }
}
