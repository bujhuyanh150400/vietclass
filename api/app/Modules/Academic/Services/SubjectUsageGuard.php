<?php

namespace App\Modules\Academic\Services;

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;

final class SubjectUsageGuard
{
    /**
     * Create the guard with the subject queries that establish its cross-record rules.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Refuse a subject update that would deactivate a used subject or remove a used grade.
     *
     * @param  list<int>  $gradeLevels
     */
    public function ensureCanUpdate(Subject $subject, array $gradeLevels, bool $isActive): void
    {
        if (! $isActive) {
            $activeClasses = $this->subjects->countClasses($subject, ClassStatus::Active);

            if ($activeClasses > 0) {
                throw new ActionError(
                    message: "Môn học đang được dùng bởi {$activeClasses} lớp đang hoạt động, không thể khóa.",
                    code: AcademicError::SubjectInUse,
                );
            }
        }

        $excludedGrades = $this->subjects->activeClassGradesOutside($subject, $gradeLevels);

        if ($excludedGrades === []) {
            return;
        }

        $grade = $excludedGrades[0];
        $classes = count($excludedGrades);

        throw new ActionError(
            message: "Môn học đang được dùng bởi {$classes} lớp đang hoạt động ở khối {$grade}, không thể bỏ khối này.",
            code: AcademicError::SubjectGradeInUse,
        );
    }

    /**
     * Refuse assigning or reactivating a class at a grade its subject does not offer.
     */
    public function ensureSupportsGrade(Subject $subject, int $gradeLevel): void
    {
        $gradeLevels = array_map('intval', $subject->grade_levels ?? []);

        if (in_array($gradeLevel, $gradeLevels, true)) {
            return;
        }

        throw new ActionError(
            message: "Môn học này không áp dụng cho khối {$gradeLevel}.",
            code: AcademicError::SubjectGradeUnavailable,
        );
    }
}
