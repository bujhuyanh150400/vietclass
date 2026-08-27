<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use Carbon\CarbonImmutable;

final class LeaveClassAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * End a student's membership of a class from the given date.
     *
     * The enrolment row is kept rather than removed, so the period the student did
     * attend stays on the record and everything built on it later still resolves.
     *
     * @return ActionResult<ClassEnrollment, AcademicError>
     */
    public function handle(int $enrollmentId, string $leftAt, string $reason): ActionResult
    {
        try {
            $enrollment = $this->enrollments->findById($enrollmentId);

            if (! $enrollment instanceof ClassEnrollment) {
                throw new ActionError(
                    message: 'Không tìm thấy bản ghi ghi danh.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            if ($enrollment->schoolClass->status !== ClassStatus::Active) {
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

            return ActionResult::success($this->enrollments->update($enrollment, [
                'left_at' => $leavesOn->toDateString(),
                'note' => trim(($enrollment->note ? $enrollment->note."\n" : '')."[Nghỉ học]: {$reason}"),
            ]));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
