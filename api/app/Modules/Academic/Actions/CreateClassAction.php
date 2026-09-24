<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Repositories\TeacherRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
     * A class opens only with active, grade-appropriate subjects and employed teachers;
     * persist its complete teaching team in the same transaction.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(array $attributes): ActionResult
    {
        try {
            $class = DB::transaction(function () use ($attributes): SchoolClass {
                $subjectIds = array_map('intval', $attributes['subject_ids'] ?? [$attributes['subject_id']]);
                sort($subjectIds, SORT_NUMERIC);
                foreach ($subjectIds as $subjectId) {
                    $subject = $this->subjects->findByIdForUpdate((int) $subjectId);

                    if (! $subject instanceof Subject) {
                        throw new ActionError(message: 'Không tìm thấy môn học.', code: AcademicError::SubjectNotFound);
                    }

                    if (! $subject->is_active) {
                        throw new ActionError(message: 'Môn học này đã bị khóa, không thể mở lớp mới.', code: AcademicError::SubjectInactive);
                    }

                    $this->usage->ensureSupportsGrade(subject: $subject, gradeLevel: (int) $attributes['grade_level']);
                }

                $leadTeacherId = (int) $attributes['teacher_id'];
                $assistantIds = array_map('intval', $attributes['assistant_teacher_ids'] ?? []);
                sort($assistantIds, SORT_NUMERIC);

                if (in_array($leadTeacherId, $assistantIds, true)) {
                    throw ValidationException::withMessages([
                        'assistant_teacher_ids' => 'Giáo viên phụ trách không thể đồng thời là trợ giảng.',
                    ]);
                }

                $teachers = $this->teachers->lockByIds(array_values(array_unique([$leadTeacherId, ...$assistantIds])))
                    ->keyBy('profile_id');
                $teacher = $teachers->get($leadTeacherId);

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

                foreach ($assistantIds as $assistantId) {
                    $assistant = $teachers->get($assistantId);
                    if (! $assistant instanceof TeacherProfile || $assistant->status !== TeacherStatus::Active) {
                        throw new ActionError(message: 'Trợ giảng này không còn làm việc hoặc không tồn tại.', code: AcademicError::TeacherInactive);
                    }
                }

                $subjectId = (int) $attributes['subject_id'];
                unset($attributes['subject_id'], $attributes['subject_ids'], $attributes['teacher_id'], $attributes['assistant_teacher_ids']);
                $class = $this->classes->create([...$attributes, 'status' => ClassStatus::Active]);

                $subjectAssignments = array_fill_keys($subjectIds, ['is_primary' => false]);
                $subjectAssignments[$subjectId] = ['is_primary' => true];
                $class->subjects()->sync($subjectAssignments);

                $teacherAssignments = array_fill_keys($assistantIds, ['is_primary' => false]);
                $teacherAssignments[$leadTeacherId] = ['is_primary' => true];
                $class->teachers()->sync($teacherAssignments);

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
