<?php

namespace App\Modules\Identity\Http\Requests\Students;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreStudentRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may create a student.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated student payload, which creates a profile and its login
     * account together.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50', Rule::unique('users', 'username')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'dob' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before:today'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'grade_level' => ['required', 'integer', Rule::in(GradeLevel::values())],
            'parent_name' => ['required', 'string', 'max:255'],
            'parent_phone' => ['sometimes', 'nullable', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'integer', Rule::in(StudentStatus::values())],
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
            'username.unique' => 'Có tài khoản đã dùng tên đăng nhập này, vui lòng chọn tên khác.',
            'phone.regex' => 'Số điện thoại không hợp lệ.',
            'parent_phone.regex' => 'Số điện thoại phụ huynh không hợp lệ.',
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay.',
        ];
    }
}
