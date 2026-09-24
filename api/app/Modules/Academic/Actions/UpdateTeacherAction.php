<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\TeacherProfile;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Repositories\TeacherRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateTeacherAction
{
    /** Attributes that belong on the shared profile row. */
    private const PROFILE_KEYS = ['full_name', 'phone', 'email', 'gender', 'address'];

    /** Attributes that belong on the teaching row. */
    private const TEACHER_KEYS = ['status', 'joined_at', 'color_identification'];

    /**
     * Create the action with its profile, teaching, and class collaborators.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
        private readonly ProfileRepository $profiles,
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Apply teacher profile edits and, when leaving, hand off active classes atomically.
     *
     * The login name is not part of this operation: it identifies the account across
     * tokens and logs, and the fork treated it as fixed after creation too. Password
     * and account locking each have their own endpoint.
     *
     * @param  array<string, mixed>  $attributes
     * @return ActionResult<TeacherProfile, AcademicPersonError>
     */
    public function handle(int $teacherId, array $attributes): ActionResult
    {
        try {
            $replacementMap = is_array($attributes['replacement_teacher_ids'] ?? null)
                ? $attributes['replacement_teacher_ids']
                : [];
            $replacementIds = array_values(array_unique(array_map('intval', array_values($replacementMap))));
            $teacherIds = array_values(array_unique([$teacherId, ...$replacementIds]));
            sort($teacherIds, SORT_NUMERIC);

            DB::transaction(function () use ($teacherId, $teacherIds, $replacementMap, $attributes): void {
                $lockedTeachers = $this->teachers->lockByIds($teacherIds)->keyBy('profile_id');
                $teacher = $lockedTeachers->get($teacherId);

                if (! $teacher instanceof TeacherProfile) {
                    throw new ActionError(
                        message: 'Không tìm thấy giáo viên.',
                        code: AcademicPersonError::TeacherNotFound,
                    );
                }

                $this->profiles->update($teacher->profile, Arr::only($attributes, self::PROFILE_KEYS));

                $requestedStatus = (int) ($attributes['status'] ?? $teacher->status->value);
                if ($teacher->status === TeacherStatus::Active && $requestedStatus === TeacherStatus::Inactive->value) {
                    $activeClasses = $this->classes->lockActiveAssignmentsForTeacher($teacherId);
                    $this->handoffActiveClasses($teacher, $activeClasses, $replacementMap, $lockedTeachers);
                }

                $this->teachers->update($teacher, Arr::only($attributes, self::TEACHER_KEYS));
            });

            return ActionResult::success($this->teachers->findById($teacherId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Remove the departing teacher's active assistant roles and replace every active lead.
     *
     * @param  Collection<int, SchoolClass>  $activeClasses
     * @param  array<int|string, mixed>  $replacementMap
     * @param  Collection<int, TeacherProfile>  $lockedTeachers
     */
    private function handoffActiveClasses(
        TeacherProfile $teacher,
        Collection $activeClasses,
        array $replacementMap,
        Collection $lockedTeachers,
    ): void {
        $replacements = [];
        foreach ($replacementMap as $classId => $replacementId) {
            $replacements[(int) $classId] = (int) $replacementId;
        }

        $leadClasses = $activeClasses
            ->filter(fn (SchoolClass $class): bool => (int) $class->teacher_id === (int) $teacher->profile_id)
            ->values();
        $assistantsByClass = $activeClasses->mapWithKeys(fn (SchoolClass $class): array => [
            (int) $class->id => $class->assistantTeachers->pluck('profile_id')->map(static fn ($id): int => (int) $id)->all(),
        ]);
        $leadClassIds = $leadClasses->map(fn (SchoolClass $class): int => (int) $class->id)->all();

        foreach (array_keys($replacements) as $classId) {
            if (! in_array($classId, $leadClassIds, true)) {
                throw ValidationException::withMessages([
                    "replacement_teacher_ids.{$classId}" => 'Lớp này không còn do giáo viên phụ trách.',
                ]);
            }
        }

        foreach ($leadClasses as $class) {
            $classId = (int) $class->id;
            $field = "replacement_teacher_ids.{$classId}";

            if (! array_key_exists($classId, $replacements)) {
                throw ValidationException::withMessages([
                    $field => 'Chọn giáo viên thay thế cho lớp này.',
                ]);
            }

            $replacementId = $replacements[$classId];
            $replacement = $lockedTeachers->get($replacementId);

            if ($replacementId === (int) $teacher->profile_id) {
                throw ValidationException::withMessages([
                    $field => 'Giáo viên nghỉ việc không thể thay thế chính mình.',
                ]);
            }

            if (! $replacement instanceof TeacherProfile || $replacement->status !== TeacherStatus::Active) {
                throw ValidationException::withMessages([
                    $field => 'Giáo viên thay thế phải đang làm việc.',
                ]);
            }
        }

        foreach ($activeClasses as $class) {
            $class->teachers()->detach($teacher->profile_id);
        }

        foreach ($leadClasses as $class) {
            $classId = (int) $class->id;
            $replacementId = $replacements[$classId];
            $assistantIds = array_values(array_diff(
                $assistantsByClass->get($classId, []),
                [(int) $teacher->profile_id, $replacementId],
            ));
            $assignments = array_fill_keys($assistantIds, ['is_primary' => false]);
            $assignments[$replacementId] = ['is_primary' => true];
            $class->teachers()->sync($assignments);
        }
    }
}
