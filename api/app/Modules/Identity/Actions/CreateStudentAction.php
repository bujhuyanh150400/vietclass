<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\FileManagement\Enums\FileError;
use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Repositories\FileLinkRepository;
use App\Modules\FileManagement\Services\FileUploader;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Models\User;
use App\Modules\Identity\Repositories\ProfileRepository;
use App\Modules\Identity\Repositories\StudentGuardianRepository;
use App\Modules\Identity\Repositories\StudentRepository;
use App\Modules\Identity\Repositories\UserRepository;
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
        private readonly StudentGuardianRepository $guardians,
        private readonly UserRepository $users,
        private readonly FileUploader $fileUploader,
        private readonly FileLinkRepository $fileLinks,
    ) {}

    /**
     * Create a student together with the shared profile, login account, and guardian
     * beneath them.
     *
     * Every record is written in one transaction. The guardian is resolved before the
     * student's own profile is created, so a student entered with the same phone number
     * as their guardian can never match their own freshly-created row and be recorded as
     * their own guardian. The guardian is matched by phone number first, so two siblings
     * entered from two forms resolve to one guardian profile instead of two.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<StudentProfile, IdentityError|FileError>
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

                $guardianProfile = $this->resolveGuardianProfile($attributes);

                $profile = $this->profiles->create([
                    ...Arr::only($attributes, self::PROFILE_KEYS),
                    'user_id' => $user->id,
                ]);

                $this->storeAvatar(attributes: $attributes, user: $user, profile: $profile);

                $student = $this->students->create([
                    ...Arr::only($attributes, self::STUDENT_KEYS),
                    'profile_id' => $profile->id,
                ]);

                $this->guardians->linkPrimary(
                    studentProfileId: $student->profile_id,
                    guardianProfileId: $guardianProfile->id,
                    relationship: GuardianRelationship::from((int) $attributes['guardian_relationship']),
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

    /**
     * Return the profile to record as guardian, reusing an existing one when both the
     * phone number and the guardian name already belong to somebody eligible to be a
     * guardian. A guardian entered without a phone number always gets a profile of
     * their own, because there is nothing to match on.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function resolveGuardianProfile(array $attributes): Profile
    {
        $phone = $attributes['guardian_phone'] ?? null;

        if ($phone !== null) {
            $existing = $this->profiles->findGuardianByPhoneAndName(
                (string) $phone,
                (string) $attributes['guardian_name'],
            );

            if ($existing instanceof Profile) {
                return $existing;
            }
        }

        return $this->profiles->create([
            'full_name' => $attributes['guardian_name'],
            'phone' => $phone,
            'gender' => $attributes['guardian_gender'],
        ]);
    }
}
