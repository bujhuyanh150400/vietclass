<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
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
     * @return ActionResult<StudentProfile, IdentityError>
     */
    public function handle(array $attributes): ActionResult
    {
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
    }

    /**
     * Return the profile to record as guardian, reusing an existing one when the phone
     * number already belongs to somebody. A guardian entered without a phone number
     * always gets a profile of their own, because there is nothing to match on.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function resolveGuardianProfile(array $attributes): Profile
    {
        $phone = $attributes['guardian_phone'] ?? null;

        if ($phone !== null) {
            $existing = $this->profiles->findByPhone((string) $phone);

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
