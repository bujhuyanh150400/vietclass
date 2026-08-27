<?php

namespace App\Modules\Academic\Http\Requests\Classes;

use App\Modules\Identity\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateClassRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change a class.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated class payload. The code, the opening date, and the status
     * are absent: the first two never change, and the status has its own endpoint
     * because ending a class also closes its enrolments.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'teacher_id' => ['required', 'integer', Rule::exists('teachers', 'id')],
            'grade_level' => ['required', 'integer', Rule::in(GradeLevel::values())],
            'max_students' => ['required', 'integer', 'min:1', 'max:65535'],
            'base_fee_per_session' => ['sometimes', 'integer', 'min:0'],
            'teacher_salary_per_session' => ['sometimes', 'integer', 'min:0'],
            'end_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ];
    }
}
