<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleSessions;

use App\Modules\Schedule\Http\Requests\Concerns\ResolvesTeacherReadScope;
use Illuminate\Foundation\Http\FormRequest;

final class IndexScheduleSessionRequest extends FormRequest
{
    use ResolvesTeacherReadScope;

    /**
     * Allow the request; route middleware already decided who may read the calendar.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted calendar query string.
     *
     * Both bounds are required and there is no default: a calendar read has to say which
     * days it is asking about, and guessing a window on the caller's behalf would make
     * the same request mean different things on different days.
     *
     * `to` may not fall before `from`, and that rule lives here because it is a fact
     * about the pair of values submitted, which a form can point at. How *wide* the range
     * may be is a different question and is decided in the Action: the limit exists to
     * bound the work the projection does, not to describe a malformed input, and it is
     * reported with a business declaration a caller can act on by splitting the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'class_id' => ['sometimes', 'integer', 'min:1'],
            'teacher_id' => ['sometimes', 'integer', 'min:1'],
            'room_id' => ['sometimes', 'integer', 'min:1'],
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
            'to.after_or_equal' => 'Ngày kết thúc không được trước ngày bắt đầu.',
        ];
    }

    /**
     * Return the first day of the calendar being read.
     */
    public function openingDate(): string
    {
        return (string) $this->validated('from');
    }

    /**
     * Return the last day of the calendar being read, which the range includes.
     */
    public function closingDate(): string
    {
        return (string) $this->validated('to');
    }

    /**
     * Return the class the caller narrowed the calendar to, or null for every class.
     */
    public function classId(): ?int
    {
        return $this->optionalIdentifier('class_id');
    }

    /**
     * Return the teacher the caller narrowed the calendar to, or null for everybody.
     *
     * This is a filter the caller chose, which is a different thing from the read scope a
     * teacher is held to: a teacher filtering on somebody else is answered with an empty
     * calendar rather than with the other person's, and that decision is the Action's.
     */
    public function teacherProfileId(): ?int
    {
        return $this->optionalIdentifier('teacher_id');
    }

    /**
     * Return the room the caller narrowed the calendar to, or null for every room.
     */
    public function roomId(): ?int
    {
        return $this->optionalIdentifier('room_id');
    }

    /**
     * Return one validated optional identifier as an integer, or null when the caller
     * did not submit it.
     */
    private function optionalIdentifier(string $key): ?int
    {
        $value = $this->validated($key);

        return $value === null ? null : (int) $value;
    }
}
