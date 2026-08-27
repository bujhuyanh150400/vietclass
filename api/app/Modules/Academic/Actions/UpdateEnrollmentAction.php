<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use Carbon\CarbonImmutable;

final class UpdateEnrollmentAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * Correct the join date, leave date, or note on one enrolment.
     *
     * Unlike transferring or ending a membership, this works on closed periods too,
     * because its purpose is fixing a record that was entered wrongly. Reopening a
     * closed period is refused when the student already holds a running enrolment in
     * the same class, which would leave two of them open at once.
     *
     * @param  array{enrolled_at: string, left_at?: string|null, note?: string|null}  $attributes
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(int $enrollmentId, array $attributes): ActionResult
    {
        try {
            $enrollment = $this->enrollments->findById($enrollmentId);

            if (! $enrollment instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            $class = $enrollment->schoolClass;

            if ($class->status !== ClassStatus::Active) {
                throw new ActionError(
                    message: 'Lớp đã kết thúc, không thể thay đổi danh sách học sinh.',
                    code: AcademicError::ClassNotActive,
                );
            }

            $enrolledAt = CarbonImmutable::parse($attributes['enrolled_at']);
            $leftAt = isset($attributes['left_at'])
                ? CarbonImmutable::parse($attributes['left_at'])
                : null;

            if ($enrolledAt->lessThan($class->start_at)) {
                throw new ActionError(
                    message: 'Ngày vào lớp không thể trước ngày khai giảng ('
                        .$class->start_at->format('d/m/Y').').',
                    code: AcademicError::EnrollmentBeforeClassStart,
                );
            }

            if ($leftAt !== null && $leftAt->lessThan($enrolledAt)) {
                throw new ActionError(
                    message: 'Ngày rời lớp không thể trước ngày vào lớp ('
                        .$enrolledAt->format('d/m/Y').').',
                    code: AcademicError::LeftBeforeEnrolled,
                );
            }

            $this->guardSingleActivePeriod($enrollment, $leftAt);

            return ActionResult::success($this->enrollments->update($enrollment, [
                'enrolled_at' => $enrolledAt->toDateString(),
                'left_at' => $leftAt?->toDateString(),
                'note' => $attributes['note'] ?? $enrollment->note,
            ]));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Refuse a change that would leave the student with two running enrolments in the
     * same class at the same time.
     */
    private function guardSingleActivePeriod(ClassEnrollment $enrollment, ?CarbonImmutable $leftAt): void
    {
        $staysOpen = $leftAt === null || $leftAt->greaterThan(now());

        if (! $staysOpen) {
            return;
        }

        $conflict = $this->enrollments->hasOtherActive(
            classId: (int) $enrollment->class_id,
            studentId: (int) $enrollment->student_id,
            exceptEnrollmentId: (int) $enrollment->id,
        );

        if ($conflict) {
            throw new ActionError(
                message: 'Học sinh đã có một bản ghi đang học khác trong lớp này.',
                code: AcademicError::StudentAlreadyEnrolled,
            );
        }
    }
}
