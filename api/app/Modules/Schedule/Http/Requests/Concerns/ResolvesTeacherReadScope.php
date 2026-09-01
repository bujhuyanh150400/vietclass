<?php

namespace App\Modules\Schedule\Http\Requests\Concerns;

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;

/**
 * Resolves the read scope a teacher reads the Schedule module through.
 *
 * Every read endpoint in this module narrows the same way, and the rule is about who may
 * see what, so it is stated once here rather than copied into each request. Copying it
 * would mean a later correction reaching some endpoints and not others.
 */
trait ResolvesTeacherReadScope
{
    /**
     * Return the teacher whose records the caller may see, or null when they may see all
     * of them.
     *
     * Administrators read everything; a teacher reads only what they are on, in either
     * role. The narrowing is expressed as a value passed into the Action rather than as a
     * middleware decision, because middleware can only answer yes or no, not "these rows
     * and not those".
     *
     * A teacher account with no profile behind it resolves to `0`, an identifier no
     * record can carry, so an incomplete account sees nothing rather than everything.
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
