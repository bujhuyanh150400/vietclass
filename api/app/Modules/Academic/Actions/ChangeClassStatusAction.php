<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\ClassEnrollmentEventRepository;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use Illuminate\Support\Facades\DB;

final class ChangeClassStatusAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly SubjectRepository $subjects,
        private readonly SubjectUsageGuard $usage,
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassEnrollmentEventRepository $events,
    ) {}

    /**
     * Move a class between the running and finished states.
     *
     * Finishing a class closes every enrolment still open, so the roster reflects that
     * nobody is studying there any more, and stamps the end date. This is close to a
     * one-way door: reopening the class restores its status but not the enrolments that
     * were closed, exactly as in the fork.
     *
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(int $classId, ClassStatus $status, ?int $actorId = null): ActionResult
    {
        try {
            $class = DB::transaction(function () use ($classId, $status, $actorId): SchoolClass {
                $class = $this->classes->findByIdForUpdate($classId);

                if (! $class instanceof SchoolClass) {
                    throw new ActionError(
                        message: 'Không tìm thấy lớp học.',
                        code: AcademicError::ClassNotFound,
                    );
                }

                if ($class->status === $status) {
                    return $this->classes->findById($classId) ?? $class;
                }

                if ($status === ClassStatus::Ended) {
                    $endsOn = $class->end_at ?? now();

                    $activeEnrollments = $this->enrollments->lockActiveForClass((int) $class->id, $endsOn);
                    foreach ($activeEnrollments as $enrollment) {
                        $this->enrollments->update($enrollment, ['left_at' => $endsOn->toDateString()]);
                        $this->events->append(
                            enrollmentId: (int) $enrollment->id,
                            type: ClassEnrollmentEventType::ClosedWithClass,
                            effectiveOn: $endsOn,
                            actorId: $actorId,
                            note: 'Lớp đã kết thúc.',
                        );
                    }
                    $this->classes->update($class, [
                        'status' => $status,
                        'end_at' => $endsOn->toDateString(),
                    ]);

                    return $this->classes->findById($classId) ?? $class;
                }

                $subjectIds = $class->subjects()->orderBy('subjects.id')->pluck('subjects.id')->map(static fn ($id): int => (int) $id);
                foreach ($subjectIds as $subjectId) {
                    $subject = $this->subjects->findByIdForUpdate($subjectId);

                    if (! $subject instanceof Subject) {
                        throw new ActionError(
                            message: 'Không tìm thấy môn học.',
                            code: AcademicError::SubjectNotFound,
                        );
                    }

                    if (! $subject->is_active) {
                        throw new ActionError(
                            message: 'Môn học này đã bị khóa, không thể mở lại lớp.',
                            code: AcademicError::SubjectInactive,
                        );
                    }

                    $this->usage->ensureSupportsGrade(
                        subject: $subject,
                        gradeLevel: $class->grade_level->value,
                    );
                }

                $this->classes->update($class, ['status' => $status]);

                return $this->classes->findById($classId) ?? $class;
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
