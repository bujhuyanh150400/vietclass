<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\Concerns\ValidatesTeacherList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateScheduleTemplateRequest extends FormRequest
{
    use ValidatesTeacherList;

    /**
     * Allow the request; route middleware already decided who may revise a schedule.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for revising a fixed schedule.
     *
     * A running schedule is never edited in place, so this payload does not carry a
     * `start_date`: `effective_date` is the day the new version starts applying, and the
     * version being replaced is closed the day before it. That makes `effective_date`
     * the lower bound `end_date` is compared against — the same `end_date >= start_date`
     * rule as on the create path, written against the field that plays the start here.
     *
     * `end_time` after `start_time` and `end_date` on or after `effective_date` are
     * enforced here and nowhere else, because neither exists as a database constraint.
     * Each is attached to the later of the two fields so the `422` names the input a
     * caller has to correct.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'effective_date' => ['required', 'date_format:Y-m-d'],
            'room_id' => ['required', 'integer', 'min:1'],
            'day_of_week' => ['required', 'integer', Rule::in(DayOfWeek::values())],
            'start_time' => ['required', 'date_format:H:i,H:i:s'],
            'end_time' => ['required', 'date_format:H:i,H:i:s', 'after:start_time'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:effective_date'],
            ...$this->teacherListRules(),
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
            'day_of_week.in' => 'Thứ trong tuần không hợp lệ.',
            'end_time.after' => 'Giờ kết thúc phải sau giờ bắt đầu.',
            'end_date.after_or_equal' => 'Ngày kết thúc không được trước ngày hiệu lực.',
            ...$this->teacherListMessages(),
        ];
    }

    /**
     * Return the day the revision starts applying.
     */
    public function effectiveDate(): string
    {
        return (string) $this->validated('effective_date');
    }

    /**
     * Return the slot attributes the Action reads, with the effective date and the
     * teacher list left out because both are passed as their own arguments.
     *
     * @return array<string, mixed>
     */
    public function slotAttributes(): array
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        unset($validated['teachers'], $validated['effective_date']);

        return $validated;
    }
}
