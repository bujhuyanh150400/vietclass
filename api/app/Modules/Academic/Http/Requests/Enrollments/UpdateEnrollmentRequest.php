<?php

namespace App\Modules\Academic\Http\Requests\Enrollments;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateEnrollmentRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may correct an enrolment.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated enrolment correction payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'enrolled_at' => ['required', 'date_format:Y-m-d'],
            'left_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
