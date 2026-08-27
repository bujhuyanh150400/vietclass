<?php

namespace App\Modules\Identity\Http\Requests\Students;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateStudentRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change a student.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated student payload. The login name, password, and account
     * locked state are excluded; each has its own endpoint.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'dob' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before:today'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'grade_level' => ['required', 'integer', Rule::in(GradeLevel::values())],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['required', 'integer', Rule::in(StudentStatus::values())],
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
            'phone.regex' => 'Số điện thoại không hợp lệ.',
            'parent_phone.regex' => 'Số điện thoại phụ huynh không hợp lệ.',
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay.',
        ];
    }
}
