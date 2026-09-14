<?php

namespace App\Modules\Identity\Http\Requests\Students;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Http\Requests\Concerns\ValidatesGuardianRoster;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateStudentRequest extends FormRequest
{
    use ValidatesGuardianRoster;

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
     * The `guardians` roster is optional as a whole and is read as the complete list:
     * sending it replaces who the student is linked to, so removing somebody is
     * leaving them out rather than a separate unlink call. Omitting the key entirely
     * leaves every existing link alone, which is what lets a screen that does not show
     * guardians save the rest of the profile without disturbing them. An empty array
     * is therefore not the same as an absent key: it says "nobody", and unlinks all.
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
            ...$this->guardianRosterRules(),
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
