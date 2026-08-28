<?php

namespace App\Modules\Identity\Http\Requests\Teachers;

use App\Modules\Identity\Enums\Gender;
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
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'email' => ['required', 'email', 'max:255'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['required', 'integer', Rule::in(TeacherStatus::values())],
            'color_identification' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
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
            'color_identification.regex' => 'Màu phải ở dạng mã hex, ví dụ #FD7110.',
        ];
    }
}
