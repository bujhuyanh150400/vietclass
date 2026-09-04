<?php

namespace App\Modules\Identity\Http\Requests\Teachers;

use App\Modules\FileManagement\Rules\ManagedFileUpload;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Http\Requests\Concerns\DecodesMultipartPayload;
use App\Modules\Identity\Rules\AvatarSelection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreTeacherRequest extends FormRequest
{
    use DecodesMultipartPayload;

    /**
     * Allow the request; route middleware already decided who may create a teacher.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated teacher payload, which creates a profile and its login
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
            'phone' => ['required', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'email' => ['required', 'email', 'max:255'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['required', 'integer', Rule::in(TeacherStatus::values())],
            'color_identification' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'joined_at' => ['required', 'date_format:Y-m-d'],
            'payload' => ['nullable', 'array'],
            'avatar' => ['sometimes', 'array', new AvatarSelection(usesUploadedFile: true)],
            'avatar_file' => [
                'nullable',
                Rule::requiredIf($this->input('avatar.type') === 'file'),
                Rule::prohibitedIf($this->input('avatar.type') !== 'file'),
                new ManagedFileUpload(imagesOnly: true),
            ],
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
            'color_identification.regex' => 'Màu phải ở dạng mã hex, ví dụ #FD7110.',
        ];
    }
}
