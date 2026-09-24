<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\Academic\Enums\GradeLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'subject_ids' => ['sometimes', 'array', 'min:1'],
            'subject_ids.*' => ['required', 'integer', 'distinct', Rule::exists('subjects', 'id')],
            'teacher_id' => ['required', 'integer', Rule::exists('teacher_profiles', 'profile_id')],
            'assistant_teacher_ids' => ['sometimes', 'array'],
            'assistant_teacher_ids.*' => ['required', 'integer', 'distinct', Rule::exists('teacher_profiles', 'profile_id')],
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
     * Reject a subject list without its representative or a lead repeated as assistant.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->has('subject_ids') && ! in_array((int) $this->input('subject_id'), array_map('intval', (array) $this->input('subject_ids')), true)) {
                $validator->errors()->add('subject_ids', 'Danh sách môn phải bao gồm môn đại diện.');
            }

            if ($this->has('assistant_teacher_ids') && in_array((int) $this->input('teacher_id'), array_map('intval', (array) $this->input('assistant_teacher_ids')), true)) {
                $validator->errors()->add('assistant_teacher_ids', 'Giáo viên phụ trách không thể đồng thời là trợ giảng.');
            }
        }];
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
