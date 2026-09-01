<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleSessions;

use App\Modules\Schedule\Http\Requests\Concerns\ResolvesTeacherReadScope;
use Illuminate\Foundation\Http\FormRequest;

final class ShowScheduleSessionRequest extends FormRequest
{
    use ResolvesTeacherReadScope;

    /**
     * Allow the request; route middleware already decided who may read a session.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the accepted session detail query string, which carries nothing.
     *
     * The session is addressed by the path, so there is nothing for a caller to submit.
     * This request exists for the read scope below: a teacher may only read the sessions
     * they are on, and resolving that in the controller would put a rule about who sees
     * what into a class whose only job is to pass values along.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [];
    }
}
