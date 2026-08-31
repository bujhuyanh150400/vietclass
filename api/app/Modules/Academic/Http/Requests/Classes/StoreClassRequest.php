<?php

namespace App\Modules\Academic\Http\Requests\Classes;

use App\Modules\Identity\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreClassRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may create a class.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated class payload.
     *
     * Whether the subject is still offered and the teacher still employed is decided in
     * the Action, because both are state rules about another record rather than the
     * shape of this one.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('classes', 'code')],
            'name' => ['required', 'string', 'max:50'],
            'subject_id' => ['required', 'integer', Rule::exists('subjects', 'id')],
            'teacher_id' => ['required', 'integer', Rule::exists('teacher_profiles', 'profile_id')],
            'grade_level' => ['required', 'integer', Rule::in(GradeLevel::values())],
            // 32767, not 65535: `unsignedSmallInteger()` yields a signed `smallint` on
            // PostgreSQL, so anything above this reaches the database and fails there
            // as a 500 instead of being refused here as a field error.
            'max_students' => ['required', 'integer', 'min:1', 'max:32767'],
            'start_at' => ['required', 'date_format:Y-m-d'],
            'end_at' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:start_at'],
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
            'code.unique' => 'Mã lớp này đã tồn tại. Vui lòng đặt mã khác.',
            'end_at.after_or_equal' => 'Ngày kết thúc không thể trước ngày khai giảng.',
        ];
    }
}
