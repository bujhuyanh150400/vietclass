<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Identity\Enums\EmployeeStatus;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Repositories\TeacherRepository;

final class UpdateClassAction
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
     * Change a class.
     *
     * The class code and the opening date are dropped from the payload rather than
     * rejected: both are referenced by everything built on top of a class, and the
     * fork also treated them as fixed once the class existed. Capacity may not fall
     * below the number of students already holding a place.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(int $classId, array $attributes): ActionResult
    {
        try {
            $class = $this->classes->findById($classId);

            if (! $class instanceof SchoolClass) {
                throw new ActionError(
                    message: 'Không tìm thấy lớp học.',
                    code: AcademicError::ClassNotFound,
                );
            }

            unset($attributes['code'], $attributes['start_at'], $attributes['status']);

            $this->guardSubject($class, $attributes);
            $this->guardTeacher($class, $attributes);
            $this->guardCapacity($class, $attributes);

            return ActionResult::success($this->classes->update($class, $attributes));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Refuse a move to a subject that is no longer offered.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function guardSubject(SchoolClass $class, array $attributes): void
    {
        $subjectId = (int) ($attributes['subject_id'] ?? $class->subject_id);

        if ($subjectId === (int) $class->subject_id) {
            return;
        }

        $subject = $this->subjects->findById($subjectId);

        if (! $subject instanceof Subject) {
            throw new ActionError(
                message: 'Không tìm thấy môn học.',
                code: AcademicError::SubjectNotFound,
            );
        }

        if (! $subject->is_active) {
            throw new ActionError(
                message: 'Môn học này đã bị khóa, không thể gán cho lớp.',
                code: AcademicError::SubjectInactive,
            );
        }
    }

    /**
     * Refuse a handover to a teacher who no longer works here.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function guardTeacher(SchoolClass $class, array $attributes): void
    {
        $teacherId = (int) ($attributes['teacher_id'] ?? $class->teacher_id);

        if ($teacherId === (int) $class->teacher_id) {
            return;
        }

        $teacher = $this->teachers->findById($teacherId);

        if (! $teacher instanceof Teacher) {
            throw new ActionError(
                message: 'Không tìm thấy giáo viên.',
                code: AcademicError::TeacherNotFound,
            );
        }

        if ($teacher->status !== EmployeeStatus::Active) {
            throw new ActionError(
                message: 'Giáo viên này không còn làm việc, không thể phụ trách lớp.',
                code: AcademicError::TeacherInactive,
            );
        }
    }

    /**
     * Refuse a capacity that is already exceeded by the students in the class.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function guardCapacity(SchoolClass $class, array $attributes): void
    {
        if (! isset($attributes['max_students'])) {
            return;
        }

        $requested = (int) $attributes['max_students'];
        $enrolled = $this->classes->countActiveEnrollments((int) $class->id);

        if ($requested < $enrolled) {
            throw new ActionError(
                message: "Sĩ số tối đa ({$requested}) không thể nhỏ hơn số học sinh đang học trong lớp ({$enrolled}).",
                code: AcademicError::ClassCapacityBelowEnrolled,
            );
        }
    }
}
