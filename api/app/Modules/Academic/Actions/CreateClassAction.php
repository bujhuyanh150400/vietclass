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
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Repositories\TeacherRepository;

final class CreateClassAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly SubjectRepository $subjects,
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
            $subject = $this->subjects->findById((int) $attributes['subject_id']);

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

            $teacher = $this->teachers->findById((int) $attributes['teacher_id']);

            if (! $teacher instanceof Teacher) {
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

            return ActionResult::success($this->classes->findById((int) $class->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
