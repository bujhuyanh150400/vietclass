<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleSessions;

use Illuminate\Foundation\Http\FormRequest;

final class ResolveScheduleSessionRequest extends FormRequest
{
    /**
     * Allow the request; route middleware already decided who may materialise a session.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validated payload for materialising a projected session.
     *
     * The pair submitted is the whole identity of a projected session, because a projected
     * session has no identifier of its own. Nothing else is accepted: materialising copies
     * what the fixed schedule already projects and moves nothing, so there is no value for
     * a caller to state here.
     *
     * Whether that pair is actually projected — which depends on the schedule's window,
     * the class's window and the weekday — is decided in the Action against the projection
     * itself, so this request cannot drift from what a reader of the calendar was shown.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'template_id' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Return the fixed schedule the session is being materialised from.
     */
    public function templateId(): int
    {
        return (int) $this->validated('template_id');
    }

    /**
     * Return the date the session is being materialised on.
     */
    public function sessionDate(): string
    {
        return (string) $this->validated('date');
    }
}
