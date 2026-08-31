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
            'teacher_id' => ['required', 'integer', Rule::exists('teacher_profiles', 'profile_id')],
            'grade_level' => ['required', 'integer', Rule::in(GradeLevel::values())],
            // 32767, not 65535: `unsignedSmallInteger()` yields a signed `smallint` on
            // PostgreSQL, so anything above this reaches the database and fails there
            // as a 500 instead of being refused here as a field error.
            'max_students' => ['required', 'integer', 'min:1', 'max:32767'],
            'end_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ];
    }
}
