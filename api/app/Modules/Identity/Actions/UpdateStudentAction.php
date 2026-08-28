<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\StudentGuardian;
use App\Modules\Identity\Models\StudentProfile;
use App\Modules\Identity\Repositories\ProfileRepository;
use App\Modules\Identity\Repositories\StudentGuardianRepository;
use App\Modules\Identity\Repositories\StudentRepository;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

final class UpdateStudentAction
{
    /** Attributes that belong on the student's own profile row. */
    private const PROFILE_KEYS = ['full_name', 'phone', 'dob', 'gender', 'address', 'note'];

    /** Attributes that belong on the student row. */
    private const STUDENT_KEYS = ['grade_level', 'status'];

    /**
     * Create the action with its profile, student, and guardian collaborators.
     */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly ProfileRepository $profiles,
        private readonly StudentGuardianRepository $guardians,
    ) {}

    /**
     * Change a student profile.
     *
     * The login name is not part of this operation, matching how a teacher profile
     * behaves. Password and account locking each have their own endpoint.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<StudentProfile, IdentityError>
     */
    public function handle(int $studentId, array $attributes): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: IdentityError::StudentNotFound,
                );
            }

            DB::transaction(function () use ($student, $attributes): void {
                $this->profiles->update($student->profile, Arr::only($attributes, self::PROFILE_KEYS));
                $this->students->update($student, Arr::only($attributes, self::STUDENT_KEYS));
                $this->rewritePrimaryGuardian($student, $attributes);
            });

            return ActionResult::success($this->students->findById($studentId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Rewrite the main contact for a student.
     *
     * A guardian used by only this student is edited in place, so the link survives.
     * A guardian shared with a sibling is copy-on-write: the shared profile is left
     * untouched (the sibling keeps their own name, phone, and relationship intact)
     * and this student's link is re-pointed at a brand new profile built from the
     * submitted values instead. A student with no primary guardian yet gets one
     * created.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function rewritePrimaryGuardian(StudentProfile $student, array $attributes): void
    {
        $relationship = GuardianRelationship::from((int) $attributes['guardian_relationship']);
        $link = $student->primaryGuardian()->first();

        if ($link instanceof StudentGuardian) {
            if ($this->guardians->countLinksTo($link->guardian_profile_id) > 1) {
                $guardian = $this->profiles->create($this->newGuardianAttributes($attributes));
                $link->fill(['guardian_profile_id' => $guardian->id, 'relationship' => $relationship])->save();

                return;
            }

            $this->profiles->update($link->guardian, $this->guardianUpdateAttributes($attributes));
            $link->fill(['relationship' => $relationship])->save();

            return;
        }

        $guardian = $this->profiles->create($this->newGuardianAttributes($attributes));

        $this->guardians->linkPrimary(
            studentProfileId: $student->profile_id,
            guardianProfileId: $guardian->id,
            relationship: $relationship,
        );
    }

    /**
     * Build the attributes for a brand new guardian profile from the submitted
     * values. An omitted phone number becomes no phone number at all, matching how
     * a guardian is created from scratch on the student creation form.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function newGuardianAttributes(array $attributes): array
    {
        return [
            'full_name' => $attributes['guardian_name'],
            'phone' => $attributes['guardian_phone'] ?? null,
            'gender' => $attributes['guardian_gender'],
        ];
    }

    /**
     * Build the attributes to apply to a guardian profile edited in place.
     *
     * `guardian_name` and `guardian_gender` are required by the request, so they are
     * always present. `guardian_phone` is optional: an absent key means "leave the
     * stored phone number alone", not "erase it", so it is only included when the
     * caller actually sent it — even when the value sent is null, which is a
     * deliberate request to clear it.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function guardianUpdateAttributes(array $attributes): array
    {
        $update = [
            'full_name' => $attributes['guardian_name'],
            'gender' => $attributes['guardian_gender'],
        ];

        if (array_key_exists('guardian_phone', $attributes)) {
            $update['phone'] = $attributes['guardian_phone'];
        }

        return $update;
    }
}
