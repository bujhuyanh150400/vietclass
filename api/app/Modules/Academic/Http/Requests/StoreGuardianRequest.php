<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\GuardianRelationship;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuardianRequest extends FormRequest
{
    /** Allow the route capability middleware to own authorization. */
    public function authorize(): bool
    {
        return true;
    }

    /** Define the complete guardian profile and roster payload. */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^0[0-9]{9,10}$/'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'note' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'students' => ['required', 'array', 'min:1', 'max:100'],
            'students.*' => ['required', 'array'],
            'students.*.student_profile_id' => ['required', 'integer', 'distinct', 'min:1'],
            'students.*.relationship' => ['required', 'integer', Rule::in(GuardianRelationship::values())],
            'students.*.is_primary' => ['required', 'boolean'],
        ];
    }

    /** Return safe messages for guardian validation failures. */
    public function messages(): array
    {
        return [
            'phone.regex' => 'Số điện thoại không hợp lệ.',
            'students.min' => 'Phụ huynh phải liên kết ít nhất một học sinh.',
            'students.*.is_primary.required' => 'Vui lòng xác định liên hệ chính.',
        ];
    }
}
