<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Repositories\StudentRepository;
use App\Modules\Identity\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

final class CreateStudentAction
{
    /**
     * Create the action with its profile and account collaborators.
     */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly UserRepository $users,
    ) {}

    /**
     * Create a student profile together with the login account it belongs to.
     *
     * Both records are written in one transaction, so a failure part way through can
     * never leave an account with no profile or a profile with no account.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<Student, IdentityError>
     */
    public function handle(array $attributes): ActionResult
    {
        $student = DB::transaction(function () use ($attributes): Student {
            $user = $this->users->createAccount(
                username: (string) $attributes['username'],
                password: (string) $attributes['password'],
                role: UserRole::Student,
            );

            unset($attributes['username'], $attributes['password']);

            return $this->students->create([...$attributes, 'user_id' => $user->id]);
        });

        return ActionResult::success($this->students->findById((int) $student->id));
    }
}
