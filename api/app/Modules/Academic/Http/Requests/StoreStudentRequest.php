<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\System\Rules\ManagedFileUpload;
use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Enums\StudentStatus;
use App\Modules\Academic\Http\Requests\Concerns\DecodesMultipartPayload;
use App\Modules\Academic\Http\Requests\Concerns\ValidatesGuardianRoster;
use App\Modules\Academic\Rules\AvatarSelection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StoreStudentRequest extends FormRequest
{
    use DecodesMultipartPayload;
    use ValidatesGuardianRoster;

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
     * Guardians arrive as the `guardians` roster described by `ValidatesGuardianRoster`.
     * An absent or empty roster creates the student with nobody linked, so connecting
     * somebody later is an addition rather than a correction.
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
            ...$this->guardianRosterRules(),
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'integer', Rule::in(StudentStatus::values())],
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
            ...$this->guardianRosterMessages(),
            'dob.before' => 'Ngày sinh phải trước ngày hôm nay.',
        ];
    }

    /**
     * Apply the roster rules that span more than one key.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [fn (Validator $validator) => $this->validateGuardianRoster($validator)];
    }
}
