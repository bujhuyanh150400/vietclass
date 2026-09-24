<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Repositories\ClassEnrollmentEventRepository;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\ClassRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class LeaveClassAction
{
    /** Create the repositories that lock and append the leave operation. */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
        private readonly ClassEnrollmentEventRepository $events,
        private readonly ClassRepository $classes,
    ) {}

    /**
     * End a student's membership and append its immutable leave event atomically.
     *
     * The enrollment row remains as the student's membership period.
     *
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(int $enrollmentId, string $leftAt, string $reason, ?int $actorId = null): ActionResult
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
            $updated = DB::transaction(function () use ($enrollmentId, $classId, $leftAt, $reason, $actorId): ClassEnrollment {
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

                if (! $enrollment->isActive()) {
                    throw new ActionError(
                        message: 'Học sinh không còn học trong lớp này.',
                        code: AcademicError::EnrollmentNotActive,
                    );
                }

                $leavesOn = CarbonImmutable::parse($leftAt);
                if ($leavesOn->lessThan($enrollment->enrolled_at)) {
                    throw new ActionError(
                        message: 'Ngày nghỉ học không thể trước ngày vào lớp ('
                            .$enrollment->enrolled_at->format('d/m/Y').').',
                        code: AcademicError::LeftBeforeEnrolled,
                    );
                }

                $enrollment = $this->enrollments->update($enrollment, [
                    'left_at' => $leavesOn->toDateString(),
                    'note' => trim(($enrollment->note ? $enrollment->note."\n" : '')."[Nghỉ học]: {$reason}"),
                ]);
                $this->events->append(
                    enrollmentId: (int) $enrollment->id,
                    type: ClassEnrollmentEventType::Left,
                    effectiveOn: $leavesOn,
                    actorId: $actorId,
                    note: $reason,
                );

                return $enrollment;
            });

            return ActionResult::success($this->enrollments->findById((int) $updated->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
