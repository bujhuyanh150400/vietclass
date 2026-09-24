<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassEnrollmentRepository;
use App\Modules\Academic\Repositories\StudentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListStudentClassesAction
{
    /** Create the collaborators that verify the student and page their distinct classes. */
    public function __construct(
        private readonly StudentRepository $students,
        private readonly ClassEnrollmentRepository $enrollments,
    ) {}

    /**
     * Return one page containing each attended class once, whether current or historical.
     *
     * @return ActionResult<LengthAwarePaginator<int, SchoolClass>, AcademicError>
     */
    public function handle(int $studentId, ListQuery $query): ActionResult
    {
        try {
            if (! $this->students->existsById($studentId)) {
                throw new ActionError(
                    message: 'Không tìm thấy học sinh.',
                    code: AcademicError::StudentNotFound,
                );
            }

            /** @var LengthAwarePaginator<int, SchoolClass> $classes */
            $classes = $this->enrollments->paginateClassesForStudent($studentId, $query);

            return ActionResult::success($classes);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
