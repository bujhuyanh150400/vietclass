<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Http\Requests\ScheduleTemplates\Concerns\ValidatesTeacherList;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreScheduleTemplateRequest extends FormRequest
{
    use ValidatesTeacherList;

    /**
     * Allow the request; route middleware already decided who may open a weekly slot.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for a new weekly slot.
     *
     * `end_time` after `start_time` and `end_date` on or after `start_date` are enforced
     * here and nowhere else: both were deliberately kept out of the database as CHECK
     * constraints, so this Form Request is the only layer that refuses them. Each rule
     * is attached to the later of the two fields, which is the one a caller has to
     * correct, so the failure arrives as a `422` against that input.
     *
     * Whether the class, the room and the named teachers may actually be used — and
     * whether the slot clashes with one already booked — is decided in the Action,
     * because those are state rules about other records rather than the shape of this
     * one.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'room_id' => ['required', 'integer', 'min:1'],
            'day_of_week' => ['required', 'integer', Rule::in(DayOfWeek::values())],
            'start_time' => ['required', 'date_format:H:i,H:i:s'],
            'end_time' => ['required', 'date_format:H:i,H:i:s', 'after:start_time'],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
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
            'end_date.after_or_equal' => 'Ngày kết thúc không được trước ngày bắt đầu.',
            ...$this->teacherListMessages(),
        ];
    }

    /**
     * Return the slot attributes the Action reads, with the teacher list left out.
     *
     * @return array<string, mixed>
     */
    public function slotAttributes(): array
    {
        /** @var array<string, mixed> $validated */
        $validated = $this->validated();

        unset($validated['teachers']);

        return $validated;
    }
}
