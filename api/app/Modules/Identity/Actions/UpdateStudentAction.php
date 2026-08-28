<?php

namespace App\Modules\Identity\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\Profile;
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
     * A guardian shared with a sibling is copy-on-write, but only when the submitted
     * values actually differ from what the shared profile already holds: a form that
     * resubmits the same name, gender, and phone changes nothing about the profile,
     * because forking on every resubmission would silently split a family's shared
     * guardian across two rows that describe the same person. When the shared values
     * genuinely changed, the shared profile is left untouched (the sibling keeps their
     * own name, phone, and relationship intact) and this student's link is re-pointed
     * at a brand new profile built from the submitted values instead. A student with no
     * primary guardian yet gets one created.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function rewritePrimaryGuardian(StudentProfile $student, array $attributes): void
    {
        $relationship = GuardianRelationship::from((int) $attributes['guardian_relationship']);
        $link = $student->primaryGuardian()->first();

        if ($link instanceof StudentGuardian) {
            $isShared = $this->guardians->countLinksTo($link->guardian_profile_id) > 1;

            if ($isShared && $this->guardianValuesChanged($link->guardian, $attributes)) {
                $guardian = $this->profiles->create($this->newGuardianAttributes($attributes));
                $link->fill(['guardian_profile_id' => $guardian->id, 'relationship' => $relationship])->save();

                return;
            }

            if (! $isShared) {
                $this->profiles->update($link->guardian, $this->guardianUpdateAttributes($attributes));
            }

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
     * Determine whether the submitted guardian values differ from what the shared
     * guardian profile already holds.
     *
     * Compared exactly, with no trimming or case folding: this codebase does not
     * normalise `full_name` anywhere else (not on creation, not on the solo-guardian
     * edit path), so treating two differently-cased or differently-spaced names as
     * "the same" here would be an inconsistency invented just for this check, and it
     * would silently discard a genuine correction a caller made to a shared profile's
     * name. `guardian_phone` is compared only when the payload carries the key,
     * matching how an absent key means "leave the stored phone alone" everywhere else
     * in this action.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function guardianValuesChanged(Profile $guardian, array $attributes): bool
    {
        if ($guardian->full_name !== (string) $attributes['guardian_name']) {
            return true;
        }

        if ($guardian->gender !== Gender::from((int) $attributes['guardian_gender'])) {
            return true;
        }

        if (array_key_exists('guardian_phone', $attributes) && $guardian->phone !== $attributes['guardian_phone']) {
            return true;
        }

        return false;
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
