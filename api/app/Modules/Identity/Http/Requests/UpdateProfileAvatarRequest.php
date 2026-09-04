<?php

namespace App\Modules\Identity\Http\Requests;

use App\Modules\Identity\Rules\AvatarSelection;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateProfileAvatarRequest extends FormRequest
{
    /** Allow broad feature authorization to remain in route middleware and ownership in the Action. */
    public function authorize(): bool
    {
        return true;
    }

    /** Validate the whole request as one discriminated avatar union. */
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'array', new AvatarSelection],
        ];
    }

    /** Put direct JSON fields behind the single union rule without accepting an alternate wrapper. */
    public function validationData(): array
    {
        return ['avatar' => $this->json()->all()];
    }
}
