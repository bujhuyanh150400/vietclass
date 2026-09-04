<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Repositories\FileLinkRepository;
use App\Modules\FileManagement\Services\FileUploader;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Models\User;
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
        private readonly FileUploader $fileUploader,
        private readonly FileLinkRepository $fileLinks,
    ) {}

    /**
     * Create a teacher together with the shared profile and login account beneath it.
     *
     * All three records are written in one transaction, so a failure part way through
     * can never leave an account with no profile or a profile with no teaching role.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<TeacherProfile, IdentityError|FileError>
     */
    public function handle(array $attributes): ActionResult
    {
        try {
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

                $this->storeAvatar(attributes: $attributes, user: $user, profile: $profile);

                return $this->teachers->create([
                    ...Arr::only($attributes, self::TEACHER_KEYS),
                    'profile_id' => $profile->id,
                ]);
            });

            return ActionResult::success($this->teachers->findById((int) $teacher->profile_id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Store the selected avatar inside the surrounding account-creation transaction.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function storeAvatar(array $attributes, User $user, Profile $profile): void
    {
        $avatar = $attributes['avatar'] ?? ['type' => 'none'];

        if (($avatar['type'] ?? 'none') === 'file') {
            $file = $this->fileUploader->store(
                owner: $user,
                upload: $attributes['avatar_file'],
                displayName: null,
            );
            $profile->forceFill(['avatar_config' => ['type' => 'file']])->save();
            $this->fileLinks->create(
                fileId: $file->id,
                type: FileLinkType::ProfileAvatar,
                foreignId: $profile->id,
            );

            return;
        }

        if (($avatar['type'] ?? 'none') === 'dicebear') {
            $profile->forceFill(['avatar_config' => $avatar])->save();
        }
    }
}
