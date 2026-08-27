<?php

namespace App\Modules\Academic\Http\Requests\Subjects;

use Illuminate\Foundation\Http\FormRequest;

final class ToggleSubjectActiveRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may lock a subject.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated locked-state payload.
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
