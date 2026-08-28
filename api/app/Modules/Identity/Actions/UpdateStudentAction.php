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
     * An existing primary guardian is edited in place rather than replaced, so the
     * link survives and a guardian shared with a sibling keeps one profile. A student
     * with no primary guardian yet gets one created.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function rewritePrimaryGuardian(StudentProfile $student, array $attributes): void
    {
        $relationship = GuardianRelationship::from((int) $attributes['guardian_relationship']);
        $link = $student->primaryGuardian()->first();

        if ($link instanceof StudentGuardian) {
            $this->profiles->update($link->guardian, [
                'full_name' => $attributes['guardian_name'],
                'phone' => $attributes['guardian_phone'] ?? null,
                'gender' => $attributes['guardian_gender'],
            ]);

            $link->fill(['relationship' => $relationship])->save();

            return;
        }

        $guardian = $this->profiles->create([
            'full_name' => $attributes['guardian_name'],
            'phone' => $attributes['guardian_phone'] ?? null,
            'gender' => $attributes['guardian_gender'],
        ]);

        $this->guardians->linkPrimary(
            studentProfileId: $student->profile_id,
            guardianProfileId: $guardian->id,
            relationship: $relationship,
        );
    }
}
