<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Repositories\TeacherRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateClassAction
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
     * Change a class and its subject and teaching-team relationships atomically.
     *
     * The class code and opening date are immutable, and capacity may not fall below
     * current enrolment. Legacy clients retain omitted additional subjects/assistants.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(int $classId, array $attributes): ActionResult
    {
        try {
            $class = DB::transaction(function () use ($classId, $attributes): SchoolClass {
                // Match offboarding's teacher-before-class order so a teacher cannot be assigned while leaving.
                $teacherIds = $this->classes->teacherIdsForClass($classId);
                if (isset($attributes['teacher_id'])) {
                    $teacherIds[] = (int) $attributes['teacher_id'];
                }
                if (isset($attributes['assistant_teacher_ids'])) {
                    array_push($teacherIds, ...array_map('intval', $attributes['assistant_teacher_ids']));
                }
                $teacherIds = array_values(array_unique($teacherIds));
                sort($teacherIds, SORT_NUMERIC);
                $lockedTeachers = $this->teachers->lockByIds($teacherIds)->keyBy('profile_id');
                $lockedTeacherIds = $lockedTeachers->keys()->map(static fn ($id): int => (int) $id)->all();

                $class = $this->classes->findByIdForUpdate($classId);

                if (! $class instanceof SchoolClass) {
                    throw new ActionError(
                        message: 'Không tìm thấy lớp học.',
                        code: AcademicError::ClassNotFound,
                    );
                }

                $currentTeacherIds = $class->teachers()
                    ->pluck('teacher_profiles.profile_id')
                    ->map(static fn ($id): int => (int) $id)
                    ->all();
                if (array_diff($currentTeacherIds, $lockedTeacherIds) !== []) {
                    throw ValidationException::withMessages([
                        'teacher_id' => 'Đội ngũ lớp vừa thay đổi. Vui lòng tải lại và thử lại.',
                    ]);
                }

                $currentSubjectIds = array_map('intval', $class->subjects()->pluck('subjects.id')->all());
                $currentSubjectIds[] = (int) $class->subject_id;
                $currentSubjectIds = array_values(array_unique($currentSubjectIds));
                sort($currentSubjectIds, SORT_NUMERIC);

                $subjectId = (int) ($attributes['subject_id'] ?? $class->subject_id);
                if (array_key_exists('subject_ids', $attributes)) {
                    $subjectIds = array_values(array_unique(array_map('intval', $attributes['subject_ids'])));
                } else {
                    $subjectIds = array_values(array_filter(
                        $currentSubjectIds,
                        fn (int $currentSubjectId): bool => $currentSubjectId !== (int) $class->subject_id,
                    ));
                    $subjectIds[] = $subjectId;
                    $subjectIds = array_values(array_unique($subjectIds));
                }
                sort($subjectIds, SORT_NUMERIC);

                $assistantListWasSubmitted = array_key_exists('assistant_teacher_ids', $attributes);
                $assistantIds = $assistantListWasSubmitted
                    ? array_values(array_unique(array_map('intval', $attributes['assistant_teacher_ids'])))
                    : array_map('intval', $class->assistantTeachers()->pluck('teacher_profiles.profile_id')->all());
                sort($assistantIds, SORT_NUMERIC);

                $leadTeacherId = (int) ($attributes['teacher_id'] ?? $class->teacher_id);
                // Recheck the field-level rule under the class lock if another edit changed the team.
                if (in_array($leadTeacherId, $assistantIds, true)) {
                    throw ValidationException::withMessages([
                        'teacher_id' => 'Giáo viên phụ trách không thể đồng thời là trợ giảng.',
                    ]);
                }

                $gradeLevel = (int) ($attributes['grade_level'] ?? $class->grade_level->value);
                $this->guardSubjects($class, $currentSubjectIds, $subjectIds, $subjectId, $gradeLevel);
                if ($gradeLevel !== $class->grade_level->value
                    && $this->classes->hasActiveEnrollmentWithDifferentGrade((int) $class->id, $gradeLevel)) {
                    throw ValidationException::withMessages([
                        'grade_level' => 'Không thể đổi khối vì có học sinh đang học không cùng khối mới.',
                    ]);
                }
                $this->guardTeacher($leadTeacherId, (int) $class->teacher_id, $lockedTeachers);
                $this->guardAssistantTeachers($assistantIds, $lockedTeachers);
                $this->guardCapacity($class, $attributes);

                unset(
                    $attributes['code'],
                    $attributes['start_at'],
                    $attributes['status'],
                    $attributes['subject_ids'],
                    $attributes['assistant_teacher_ids'],
                    $attributes['subject_id'],
                    $attributes['teacher_id'],
                );

                $updated = $this->classes->update($class, $attributes);
                $subjectAssignments = array_fill_keys($subjectIds, ['is_primary' => false]);
                $subjectAssignments[$subjectId] = ['is_primary' => true];
                $updated->subjects()->sync($subjectAssignments);

                $teacherAssignments = array_fill_keys($assistantIds, ['is_primary' => false]);
                $teacherAssignments[$leadTeacherId] = ['is_primary' => true];
                $updated->teachers()->sync($teacherAssignments);

                return $this->classes->findById($classId) ?? $updated;
            });

            return ActionResult::success($class);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Validate the complete subject set when a class changes subject membership or grade.
     *
     * @param  list<int>  $currentSubjectIds
     * @param  list<int>  $subjectIds
     */
    private function guardSubjects(
        SchoolClass $class,
        array $currentSubjectIds,
        array $subjectIds,
        int $subjectId,
        int $gradeLevel,
    ): void {
        $subjectSetChanged = $subjectIds !== $currentSubjectIds;
        $representativeChanged = $subjectId !== (int) $class->subject_id;
        $gradeChanged = $gradeLevel !== $class->grade_level->value;

        if (! $subjectSetChanged && ! $representativeChanged && ! $gradeChanged) {
            return;
        }

        foreach ($subjectIds as $selectedSubjectId) {
            $subject = $this->subjects->findByIdForUpdate($selectedSubjectId);

            if (! $subject instanceof Subject) {
                throw new ActionError(
                    message: 'Không tìm thấy môn học.',
                    code: AcademicError::SubjectNotFound,
                );
            }

            $isExistingSubject = in_array($selectedSubjectId, $currentSubjectIds, true);
            $isNewRepresentative = $representativeChanged && $selectedSubjectId === $subjectId;
            if (! $subject->is_active && (! $isExistingSubject || $isNewRepresentative)) {
                throw new ActionError(
                    message: 'Môn học này đã bị khóa, không thể gán cho lớp.',
                    code: AcademicError::SubjectInactive,
                );
            }

            $this->usage->ensureSupportsGrade(subject: $subject, gradeLevel: $gradeLevel);
        }
    }

    /**
     * Refuse selected assistants that do not exist or are no longer working.
     *
     * @param  list<int>  $assistantIds
     * @param  Collection<int, TeacherProfile>  $lockedTeachers
     */
    private function guardAssistantTeachers(array $assistantIds, Collection $lockedTeachers): void
    {
        foreach ($assistantIds as $assistantId) {
            $assistant = $lockedTeachers->get($assistantId);

            if (! $assistant instanceof TeacherProfile) {
                throw new ActionError(
                    message: 'Không tìm thấy giáo viên.',
                    code: AcademicError::TeacherNotFound,
                );
            }

            if ($assistant->status !== TeacherStatus::Active) {
                throw new ActionError(
                    message: 'Trợ giảng này không còn làm việc, không thể gán cho lớp.',
                    code: AcademicError::TeacherInactive,
                );
            }
        }
    }

    /**
     * Refuse a new lead assignment to a missing teacher or one who no longer works here.
     *
     * Keeping the current lead is compatible with classes whose existing teacher later left.
     *
     * @param  Collection<int, TeacherProfile>  $lockedTeachers
     */
    private function guardTeacher(int $teacherId, int $currentTeacherId, Collection $lockedTeachers): void
    {
        if ($teacherId === $currentTeacherId) {
            return;
        }

        $teacher = $lockedTeachers->get($teacherId);

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
