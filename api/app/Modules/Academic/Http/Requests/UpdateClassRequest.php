<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class UpdateClassRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may change a class.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated class payload. The code, the opening date, and the status
     * are absent: the first two never change, and the status has its own endpoint
     * because ending a class also closes its enrolments.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
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
            'end_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Validate complete relationship sets and reject legacy updates that create dual roles.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->has('subject_ids') && ! in_array((int) $this->input('subject_id'), array_map('intval', (array) $this->input('subject_ids')), true)) {
                $validator->errors()->add('subject_ids', 'Danh sách môn phải bao gồm môn đại diện.');
            }

            if ($this->has('assistant_teacher_ids')) {
                if (in_array((int) $this->input('teacher_id'), array_map('intval', (array) $this->input('assistant_teacher_ids')), true)) {
                    $validator->errors()->add('assistant_teacher_ids', 'Giáo viên phụ trách không thể đồng thời là trợ giảng.');
                }

                return;
            }

            if ($validator->errors()->has('teacher_id')) {
                return;
            }

            $class = SchoolClass::query()->find((int) $this->route('class'));
            if ($class?->assistantTeachers()->where('teacher_profiles.profile_id', (int) $this->input('teacher_id'))->exists()) {
                $validator->errors()->add('teacher_id', 'Giáo viên phụ trách không thể đồng thời là trợ giảng.');
            }
        }];
    }
}
