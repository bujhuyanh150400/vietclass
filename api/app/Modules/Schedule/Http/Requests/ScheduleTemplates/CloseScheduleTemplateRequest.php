<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use Illuminate\Foundation\Http\FormRequest;

final class CloseScheduleTemplateRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may close a schedule.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for closing a fixed schedule.
     *
     * Only the last day the schedule applies is submitted. Whether that day is allowed —
     * it may not fall before the day the schedule started applying — is decided in the
     * Action, because the lower bound lives on the stored row rather than in this
     * payload.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'end_date' => ['required', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Return the last day the schedule still applies.
     */
    public function endDate(): string
    {
        return (string) $this->validated('end_date');
    }
}
