<?php

namespace App\Modules\Schedule\Http\Requests\ScheduleTemplates;

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class IndexScheduleTemplateRequest extends FormRequest
{
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

    /**
     * Return the teacher whose schedules the caller may see, or null when they may see
     * all of them.
     *
     * Administrators read the whole class; a teacher reads only the slots they are on,
     * in either role. The narrowing is expressed as a value passed into the Action
     * rather than as a middleware decision, because middleware can only answer yes or
     * no, not "these rows and not those".
     *
     * A teacher account with no profile behind it resolves to `0`, an identifier no
     * schedule can carry, so an incomplete account sees nothing rather than everything.
     */
    public function teacherProfileScope(): ?int
    {
        $user = $this->user();

        if (! $user instanceof User || $user->role !== UserRole::Teacher) {
            return null;
        }

        return (int) (Profile::query()->where('user_id', $user->id)->value('id') ?? 0);
    }
}
