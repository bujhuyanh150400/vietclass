<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Data\EnrollmentHistoryEntry;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Repositories\ClassEnrollmentEventRepository;
use App\Modules\Academic\Repositories\StudentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListEnrollmentHistoryAction
{
    /** Create the student and append-only history query collaborators. */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly ClassEnrollmentEventRepository $events,
    ) {}

    /**
     * Return one class-filtered timeline without inferring events from notes.
     *
     * @return ActionResult<LengthAwarePaginator<int, EnrollmentHistoryEntry>, AcademicError>
     */
    public function handle(int $studentId, int $classId, ListQuery $query): ActionResult
    {
        try {
            if (! $this->students->existsById($studentId)) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicError::StudentNotFound,
                );
            }

            if (! $this->events->studentHasClass($studentId, $classId)) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch sử ghi danh cho lớp này.',
                    code: AcademicError::EnrollmentNotFound,
                );
            }

            return ActionResult::success($this->events->paginateForStudentClass($studentId, $classId, $query));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
