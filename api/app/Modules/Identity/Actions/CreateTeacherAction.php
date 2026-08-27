<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Repositories\TeacherRepository;
use App\Modules\Identity\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

final class CreateTeacherAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly UserRepository $users,
    ) {}

    /**
     * Create a teacher profile together with the login account it belongs to.
     *
     * Both records are written in one transaction, so a failure part way through can
     * never leave an account with no profile or a profile with no account.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<Teacher, IdentityError>
     */
    public function handle(array $attributes): ActionResult
    {
        $teacher = DB::transaction(function () use ($attributes): Teacher {
            $user = $this->users->createAccount(
                username: (string) $attributes['username'],
                password: (string) $attributes['password'],
                role: UserRole::Teacher,
            );

            unset($attributes['username'], $attributes['password']);

            return $this->teachers->create([...$attributes, 'user_id' => $user->id]);
        });

        return ActionResult::success($this->teachers->findById((int) $teacher->id));
    }
}
