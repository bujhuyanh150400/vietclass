<?php

namespace App\Modules\Identity\Http\Requests\Teachers;

use App\Modules\Identity\Enums\TeacherStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTeacherRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change a teacher.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated teacher payload. The login name, password, and account
     * locked state are excluded; each has its own endpoint.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $teacherId = $this->route('teacher');

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => [
                'required',
                'string',
                'regex:/^0[0-9]{9,10}$/',
                Rule::unique('teachers', 'phone')->ignore($teacherId),
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('teachers', 'email')->ignore($teacherId),
            ],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'bank_bin' => ['sometimes', 'nullable', 'string', 'max:20'],
            'bank_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bank_account_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'bank_account_holder' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => ['required', 'integer', Rule::in(TeacherStatus::values())],
            'color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'joined_at' => ['required', 'date_format:Y-m-d'],
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
            'phone.unique' => 'Số điện thoại đã tồn tại.',
            'email.unique' => 'Email đã tồn tại.',
            'color.regex' => 'Màu phải ở dạng mã hex, ví dụ #FD7110.',
        ];
    }
}
