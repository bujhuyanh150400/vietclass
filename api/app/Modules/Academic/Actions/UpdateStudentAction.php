<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\StudentProfile;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Repositories\StudentRepository;
use App\Modules\Academic\Services\StudentGuardianRoster;
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
        private readonly StudentGuardianRoster $guardianRoster,
    ) {}

    /**
     * Change a student profile, and the people linked to them when the payload says so.
     *
     * The login name is not part of this operation, matching how a teacher profile
     * behaves. Password and account locking each have their own endpoint.
     *
     * A payload carrying no `guardians` key is not a request to change who is linked,
     * so it leaves every existing link exactly as it is. That matters for any screen
     * that saves profile fields without showing the roster: without it, saving a
     * student's grade would quietly unlink their parents. An empty array is a
     * different statement — it says "nobody" and removes them all.
     *
     * Note what this deliberately no longer does: it never edits a guardian's own
     * profile. Correcting somebody's name or phone number is a change to that person,
     * not to this student's link to them, and doing it from here is what forced the
     * old copy-on-write dance that forked a shared guardian the moment two siblings
     * disagreed about their spelling. Removing the wrong person and linking the right
     * one is now the whole vocabulary, and it cannot damage a sibling's record.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<StudentProfile, AcademicPersonError>
     */
    public function handle(int $studentId, array $attributes): ActionResult
    {
        try {
            $student = $this->students->findById($studentId);

            if (! $student instanceof StudentProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicPersonError::StudentNotFound,
                );
            }

            DB::transaction(function () use ($student, $attributes): void {
                $this->profiles->update($student->profile, Arr::only($attributes, self::PROFILE_KEYS));
                $this->students->update($student, Arr::only($attributes, self::STUDENT_KEYS));

                if (array_key_exists('guardians', $attributes)) {
                    $this->guardianRoster->apply(
                        studentProfileId: (int) $student->profile_id,
                        roster: $attributes['guardians'],
                    );
                }
            });

            return ActionResult::success($this->students->findById($studentId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
