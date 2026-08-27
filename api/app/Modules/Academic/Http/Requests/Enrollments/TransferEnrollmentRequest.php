<?php

namespace App\Modules\Academic\Http\Requests\Enrollments;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class TransferEnrollmentRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may transfer a student.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated transfer payload. Whether the target is a valid destination
     * is decided in the Action, because it depends on the class being left.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'class_id' => ['required', 'integer', Rule::exists('classes', 'id')],
            'left_at' => ['required', 'date_format:Y-m-d'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ];
    }
}
