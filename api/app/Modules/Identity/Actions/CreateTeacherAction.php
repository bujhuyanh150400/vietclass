<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Repositories\ProfileRepository;
use App\Modules\Identity\Repositories\TeacherRepository;
use App\Modules\Identity\Repositories\UserRepository;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class CreateTeacherAction
{
    /** Attributes that belong on the shared profile row. */
    private const PROFILE_KEYS = ['full_name', 'phone', 'email', 'gender', 'address'];

    /** Attributes that belong on the teaching row. */
    private const TEACHER_KEYS = ['status', 'joined_at', 'color_identification'];

    /**
     * Create the action with its profile, teaching, and account collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly ProfileRepository $profiles,
        private readonly UserRepository $users,
    ) {}

    /**
     * Create a teacher together with the shared profile and login account beneath it.
     *
     * All three records are written in one transaction, so a failure part way through
     * can never leave an account with no profile or a profile with no teaching role.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<TeacherProfile, IdentityError>
     */
    public function handle(array $attributes): ActionResult
    {
        $teacher = DB::transaction(function () use ($attributes): TeacherProfile {
            $user = $this->users->createAccount(
                username: (string) $attributes['username'],
                password: (string) $attributes['password'],
                role: UserRole::Teacher,
            );

            $profile = $this->profiles->create([
                ...Arr::only($attributes, self::PROFILE_KEYS),
                'user_id' => $user->id,
            ]);

            return $this->teachers->create([
                ...Arr::only($attributes, self::TEACHER_KEYS),
                'profile_id' => $profile->id,
            ]);
        });

        return ActionResult::success($this->teachers->findById((int) $teacher->profile_id));
    }
}
