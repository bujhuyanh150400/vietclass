<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListTransferOptionsAction
{
    /** Create the collaborators that load the current period and searchable target rows. */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Return searchable target candidates annotated with current transfer eligibility.
     *
     * @return ActionResult<LengthAwarePaginator<int, SchoolClass>, AcademicError>
     */
    public function handle(int $enrollmentId, ListQuery $query): ActionResult
    {
        try {
            $enrollment = $this->enrollments->findById($enrollmentId);
            if (! $enrollment instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            if (! $enrollment->isActive()) {
                throw new ActionError(
                    message: 'Học sinh không còn học trong lớp này.',
                    code: AcademicError::EnrollmentNotActive,
                );
            }

            $source = $enrollment->schoolClass;
            if (! $enrollment->student->profile?->user?->is_active) {
                throw new ActionError(
                    message: 'Tài khoản học sinh đã bị khóa, không thể ghi danh.',
                    code: AcademicError::StudentAccountInactive,
                );
            }

            if ($source->status !== ClassStatus::Active) {
                throw new ActionError(
                    message: 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.',
                    code: AcademicError::ClassNotActive,
                );
            }

            $sourceSubjectIds = $source->subjects()
                ->orderBy('subjects.id')
                ->pluck('subjects.id')
                ->map(static fn ($id): int => (int) $id)
                ->all();
            $targets = $this->classes->paginateTransferCandidates(
                sourceClassId: (int) $source->id,
                query: $query,
            );
            $targetIds = $targets->getCollection()->map(static fn (SchoolClass $class): int => (int) $class->id)->all();
            $activeTargetIds = $this->enrollments->activeClassIdsForStudent(
                studentId: (int) $enrollment->student_id,
                classIds: $targetIds,
            );
            $expectedSubjectIds = collect($sourceSubjectIds)->sort()->values()->all();

            foreach ($targets->getCollection() as $target) {
                $targetSubjectIds = $target->subjects
                    ->pluck('id')
                    ->map(static fn ($id): int => (int) $id)
                    ->sort()
                    ->values()
                    ->all();
                $reason = match (true) {
                    $target->status !== ClassStatus::Active => 'class_ended',
                    $target->grade_level !== $enrollment->student->grade_level => 'grade_mismatch',
                    $targetSubjectIds !== $expectedSubjectIds => 'subject_mismatch',
                    in_array((int) $target->id, $activeTargetIds, true) => 'already_enrolled',
                    (int) $target->active_students_count >= $target->max_students => 'class_full',
                    default => null,
                };

                $target->setAttribute('is_eligible', $reason === null);
                $target->setAttribute('disabled_reason', $reason);
            }

            return ActionResult::success($targets);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
