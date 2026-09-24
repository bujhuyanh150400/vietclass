<?php

namespace App\Modules\Academic\Http\Requests;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\Gender;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\TeacherProfile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'gender' => ['required', 'integer', Rule::in(Gender::values())],
            'address' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'status' => ['required', 'integer', Rule::in(TeacherStatus::values())],
            'replacement_teacher_ids' => ['sometimes', 'array'],
            'replacement_teacher_ids.*' => ['required', 'integer', Rule::exists('teacher_profiles', 'profile_id')],
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
            'replacement_teacher_ids.*.integer' => 'Mã giáo viên thay thế không hợp lệ.',
            'replacement_teacher_ids.*.exists' => 'Không tìm thấy giáo viên thay thế.',
            'color_identification.regex' => 'Màu phải ở dạng mã hex, ví dụ #FD7110.',
        ];
    }

    /**
     * Require a valid replacement for each currently active lead assignment when work ends.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('status') || (int) $this->input('status') !== TeacherStatus::Inactive->value) {
                return;
            }

            $teacherId = (int) $this->route('teacher');
            $teacher = TeacherProfile::query()->find($teacherId);
            if ($teacher?->status !== TeacherStatus::Active) {
                return;
            }

            $leadClassIds = SchoolClass::query()
                ->where('status', ClassStatus::Active)
                ->whereHas(
                    'primaryTeacher',
                    fn (Builder $teachers): Builder => $teachers->where('teacher_profiles.profile_id', $teacherId),
                )
                ->orderBy('id')
                ->pluck('id')
                ->map(static fn ($id): int => (int) $id)
                ->all();
            $replacements = $this->input('replacement_teacher_ids', []);
            if (! is_array($replacements)) {
                return;
            }

            $replacementIds = array_values(array_unique(array_map(
                'intval',
                array_filter($replacements, 'is_numeric'),
            )));
            $replacementTeachers = TeacherProfile::query()
                ->whereIn('profile_id', $replacementIds)
                ->get(['profile_id', 'status'])
                ->keyBy('profile_id');

            foreach ($leadClassIds as $classId) {
                $field = "replacement_teacher_ids.{$classId}";
                if (! array_key_exists($classId, $replacements) && ! array_key_exists((string) $classId, $replacements)) {
                    $validator->errors()->add($field, 'Chọn giáo viên thay thế cho lớp này.');

                    continue;
                }

                if ($validator->errors()->has($field)) {
                    continue;
                }

                $replacementId = (int) $replacements[$classId];
                $replacement = $replacementTeachers->get($replacementId);

                if ($replacementId === $teacherId) {
                    $validator->errors()->add($field, 'Giáo viên nghỉ việc không thể thay thế chính mình.');
                } elseif ($replacement?->status !== TeacherStatus::Active) {
                    $validator->errors()->add($field, 'Giáo viên thay thế phải đang làm việc.');
                }
            }

            foreach (array_keys($replacements) as $classId) {
                if (! in_array((int) $classId, $leadClassIds, true)) {
                    $validator->errors()->add("replacement_teacher_ids.{$classId}", 'Lớp này không còn do giáo viên phụ trách.');
                }
            }
        }];
    }
}
