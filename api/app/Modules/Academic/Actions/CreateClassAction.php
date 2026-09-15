<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\TeacherRepository;
use Illuminate\Support\Facades\DB;

final class CreateClassAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly SubjectRepository $subjects,
        private readonly SubjectUsageGuard $usage,
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Create a class.
     *
     * A class may only be opened against a subject that is still offered and a teacher
     * who is still employed, because both are references the class will carry for its
     * whole life. A new class always starts running.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(array $attributes): ActionResult
    {
        try {
            $class = DB::transaction(function () use ($attributes): SchoolClass {
                $subject = $this->subjects->findByIdForUpdate((int) $attributes['subject_id']);

                if (! $subject instanceof Subject) {
                    throw new ActionError(
                        message: 'Không tìm thấy môn học.',
                        code: AcademicError::SubjectNotFound,
                    );
                }

                if (! $subject->is_active) {
                    throw new ActionError(
                        message: 'Môn học này đã bị khóa, không thể mở lớp mới.',
                        code: AcademicError::SubjectInactive,
                    );
                }

                $this->usage->ensureSupportsGrade(
                    subject: $subject,
                    gradeLevel: (int) $attributes['grade_level'],
                );

                $teacher = $this->teachers->findById((int) $attributes['teacher_id']);

                if (! $teacher instanceof TeacherProfile) {
                    throw new ActionError(
                        message: 'Không tìm thấy giáo viên.',
                        code: AcademicError::TeacherNotFound,
                    );
                }

                if ($teacher->status !== TeacherStatus::Active) {
                    throw new ActionError(
                        message: 'Giáo viên này không còn làm việc, không thể phụ trách lớp.',
                        code: AcademicError::TeacherInactive,
                    );
                }

                $class = $this->classes->create([
                    ...$attributes,
                    'status' => ClassStatus::Active,
                ]);

                return $this->classes->findById((int) $class->id);
            });

            return ActionResult::success($class);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
