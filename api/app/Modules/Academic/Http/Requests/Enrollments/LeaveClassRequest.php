<?php

namespace App\Modules\Academic\Http\Requests\Enrollments;

use Illuminate\Foundation\Http\FormRequest;

final class LeaveClassRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may end a membership.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated leave payload. A reason is required, matching the fork,
     * because an enrolment that ends without one is impossible to explain later.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'left_at' => ['required', 'date_format:Y-m-d'],
            'reason' => ['required', 'string', 'max:2000'],
        ];
    }

    /**
     * Return the caller-facing messages for rules whose default wording is unclear.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'reason.required' => 'Vui lòng nhập lý do nghỉ học.',
        ];
    }
}
