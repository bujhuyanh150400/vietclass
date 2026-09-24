<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentEventRepository;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class UpdateEnrollmentAction
{
    /** Create the repositories that validate, lock, update, and append the event. */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassEnrollmentEventRepository $events,
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Correct a membership period and append immutable before/after snapshots atomically.
     *
     * Closed periods remain editable; reopening is refused when another period is active or capacity is exhausted.
     *
     * @param  array{enrolled_at: string, left_at?: string|null, note?: string|null}  $attributes
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(int $enrollmentId, array $attributes, ?int $actorId = null): ActionResult
    {
        try {
            $initial = $this->enrollments->findById($enrollmentId);
            if (! $initial instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            $classId = (int) $initial->class_id;
            $updated = DB::transaction(function () use ($enrollmentId, $classId, $attributes, $actorId): ClassEnrollment {
                $class = $this->classes->findByIdForUpdate($classId);
                $enrollment = $this->enrollments->findByIdForUpdate($enrollmentId);

                if (! $enrollment instanceof ClassEnrollment) {
                    throw new ActionError(
                        message: 'Không tìm thấy bản ghi ghi danh.',
                        code: AcademicError::EnrollmentNotFound,
                    );
                }

                if ($class === null || (int) $enrollment->class_id !== $classId) {
                    throw new ActionError(
                        message: 'Không tìm thấy lớp học.',
                        code: AcademicError::ClassNotFound,
                    );
                }

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
                $this->guardReopeningCapacity($class, $enrollment, $leftAt);
                $before = $this->snapshot($enrollment);
                $updated = $this->enrollments->update($enrollment, [
                    'enrolled_at' => $enrolledAt->toDateString(),
                    'left_at' => $leftAt?->toDateString(),
                    'note' => array_key_exists('note', $attributes) ? $attributes['note'] : $enrollment->note,
                ]);
                $this->events->append(
                    enrollmentId: (int) $updated->id,
                    type: ClassEnrollmentEventType::Updated,
                    effectiveOn: now(),
                    actorId: $actorId,
                    note: 'Cập nhật thông tin ghi danh.',
                    metadata: [
                        'before' => $before,
                        'after' => $this->snapshot($updated),
                    ],
                );

                return $updated;
            });

            return ActionResult::success($this->enrollments->findById((int) $updated->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /** Return the editable enrollment fields in their stable event snapshot shape. */
    private function snapshot(ClassEnrollment $enrollment): array
    {
        return [
            'enrolled_at' => $enrollment->enrolled_at?->toDateString(),
            'left_at' => $enrollment->left_at?->toDateString(),
            'note' => $enrollment->note,
        ];
    }

    /** Refuse reopening a closed period when no capacity remains in the class. */
    private function guardReopeningCapacity(
        SchoolClass $class,
        ClassEnrollment $enrollment,
        ?CarbonImmutable $leftAt,
    ): void {
        $willBeActive = $leftAt === null || $leftAt->greaterThan(now());
        if (! $willBeActive || $enrollment->isActive()) {
            return;
        }

        $enrolled = $this->classes->countActiveEnrollments((int) $class->id);
        if ($enrolled >= $class->max_students) {
            throw new ActionError(
                message: "Lớp đã đạt sĩ số tối đa ({$enrolled}/{$class->max_students} học sinh), không thể thêm.",
                code: AcademicError::ClassFull,
            );
        }
    }

    /** Refuse a change that would leave two running periods for one student and class. */
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
