<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use App\Modules\Schedule\Http\Requests\Concerns\ResolvesTeacherReadScope;
use Illuminate\Foundation\Http\FormRequest;

final class IndexScheduleTemplateRequest extends FormRequest
{
    use ResolvesTeacherReadScope;

    /**
     * Allow the request; route middleware already decided who may read a class's
     * fixed schedules.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted fixed-schedule list query string, which carries nothing.
     *
     * The list is not paged, searched or sorted by the caller: a class holds a handful
     * of weekly slots plus whatever history it has accumulated, and the Action fixes the
     * order at weekday then start time so a reader sees the week in the order the week
     * happens.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [];
    }
}
