<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\System\Enums\FileError;
use App\Modules\System\Enums\FileLinkType;
use App\Modules\System\Repositories\FileLinkRepository;
use App\Modules\System\Services\FileUploader;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Auth\Enums\UserRole;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Auth\Models\User;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Repositories\StudentRepository;
use App\Modules\Auth\Repositories\UserRepository;
use App\Modules\Academic\Services\StudentGuardianRoster;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class CreateStudentAction
{
    /** Attributes that belong on the student's own profile row. */
    private const PROFILE_KEYS = ['full_name', 'phone', 'dob', 'gender', 'address', 'note'];

    /** Attributes that belong on the student row. */
    private const STUDENT_KEYS = ['grade_level', 'status'];

    /**
     * Create the action with its profile, student, guardian, and account collaborators.
     */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly ProfileRepository $profiles,
        private readonly StudentGuardianRoster $guardianRoster,
        private readonly UserRepository $users,
        private readonly FileUploader $fileUploader,
        private readonly FileLinkRepository $fileLinks,
    ) {}

    /**
     * Create a student together with the shared profile, login account, and everybody
     * the payload links them to.
     *
     * Every record is written in one transaction, and the guardian roster is applied
     * last — once the student row exists for the links to point at. A student entered
     * with the same phone number as one of their guardians cannot be recorded as their
     * own guardian: `StudentGuardianRoster` refuses the student's own profile, and the
     * phone match only ever returns a profile eligible to act as a guardian.
     *
     * A payload with no roster leaves the student with nobody linked rather than with
     * an empty guardian profile, so connecting somebody later is an addition instead of
     * a correction.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<StudentProfile, AcademicPersonError|FileError>
     */
    public function handle(array $attributes): ActionResult
    {
        try {
            $student = DB::transaction(function () use ($attributes): StudentProfile {
                $user = $this->users->createAccount(
                    username: (string) $attributes['username'],
                    password: (string) $attributes['password'],
                    role: UserRole::Student,
                );

                $profile = $this->profiles->create([
                    ...Arr::only($attributes, self::PROFILE_KEYS),
                    'user_id' => $user->id,
                ]);

                $this->storeAvatar(attributes: $attributes, user: $user, profile: $profile);

                $student = $this->students->create([
                    ...Arr::only($attributes, self::STUDENT_KEYS),
                    'profile_id' => $profile->id,
                ]);

                $this->guardianRoster->apply(
                    studentProfileId: (int) $student->profile_id,
                    roster: $attributes['guardians'] ?? [],
                );

                return $student;
            });

            return ActionResult::success($this->students->findById((int) $student->profile_id));
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
