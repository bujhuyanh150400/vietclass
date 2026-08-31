<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use App\Modules\Schedule\Http\Requests\ScheduleTemplates\Concerns\ValidatesTeacherList;
use Illuminate\Foundation\Http\FormRequest;

final class SetScheduleTemplateTeachersRequest extends FormRequest
{
    use ValidatesTeacherList;

    /**
     * Allow the request; route middleware already decided who may restaff a schedule.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for replacing the whole teacher list of a schedule.
     *
     * The list is always submitted whole. Sending a partial list would pass the schedule
     * through a state with no main teacher or two of them, which is exactly what the
     * Action and the partial unique index behind it refuse.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return $this->teacherListRules();
    }

    /**
     * Return the caller-facing messages for rules whose default wording is unclear.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->teacherListMessages();
    }
}
