<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates\Concerns;

use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use Illuminate\Validation\Rule;

/**
 * Gives every request that names the teachers of a fixed schedule the same payload
 * shape, so creating a schedule, revising one, and replacing its teacher list cannot
 * drift apart on what the caller is allowed to send.
 *
 * Only the shape is checked here: a non-empty list of entries, each naming an integer
 * profile and a declared role. Whether the list is *usable* — exactly one main teacher,
 * nobody named twice, everybody still employed — is decided by
 * `App\Modules\Schedule\Support\ScheduleTeacherRoster` inside the Action, which is the
 * single place those rules live for all three write paths.
 */
trait ValidatesTeacherList
{
    /**
     * Return the validation rules for the teacher list a fixed schedule is staffed with.
     *
     * @return array<string, array<int, mixed>>
     */
    protected function teacherListRules(): array
    {
        return [
            'teachers' => ['required', 'array', 'max:20'],
            'teachers.*.teacher_profile_id' => ['required', 'integer', 'min:1'],
            'teachers.*.role' => ['required', 'integer', Rule::in(ScheduleTeacherRole::values())],
        ];
    }

    /**
     * Return the caller-facing messages for teacher-list rules whose default wording
     * does not say which list is meant.
     *
     * @return array<string, string>
     */
    protected function teacherListMessages(): array
    {
        return [
            // `required` refuses an absent list and an empty one alike, so one message
            // covers both readings of "nobody was named".
            'teachers.required' => 'Lịch cố định phải có ít nhất một giáo viên.',
            'teachers.*.role.in' => 'Vai trò giáo viên không hợp lệ.',
        ];
    }

    /**
     * Return the submitted teacher list in the shape the Action reads.
     *
     * @return list<array{teacher_profile_id: int, role: int}>
     */
    public function teacherList(): array
    {
        /** @var list<array{teacher_profile_id: int|string, role: int|string}> $teachers */
        $teachers = (array) $this->validated('teachers');

        return array_values(array_map(
            static fn (array $teacher): array => [
                'teacher_profile_id' => (int) $teacher['teacher_profile_id'],
                'role' => (int) $teacher['role'],
            ],
            $teachers,
        ));
    }
}
