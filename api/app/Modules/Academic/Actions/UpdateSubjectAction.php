<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use Illuminate\Support\Facades\DB;

final class UpdateSubjectAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
        private readonly SubjectUsageGuard $usage,
    ) {}

    /**
     * Change subject details, its applicability list, and its active status atomically.
     *
     * @param  array{name: string, description?: string|null, grade_levels: list<int>, is_active: bool}  $attributes
     * @return ActionResult<Subject, AcademicError>
     */
    public function handle(int $subjectId, array $attributes): ActionResult
    {
        try {
            $subject = DB::transaction(function () use ($subjectId, $attributes): Subject {
                $subject = $this->subjects->findByIdForUpdate($subjectId);

                if (! $subject instanceof Subject) {
                    throw new ActionError(
                        message: 'Không tìm thấy môn học.',
                        code: AcademicError::SubjectNotFound,
                    );
                }

                $gradeLevels = array_values(array_unique(array_map('intval', $attributes['grade_levels'])));
                sort($gradeLevels);

                $this->usage->ensureCanUpdate(
                    subject: $subject,
                    gradeLevels: $gradeLevels,
                    isActive: (bool) $attributes['is_active'],
                );

                return $this->subjects->update($subject, [
                    ...$attributes,
                    'grade_levels' => $gradeLevels,
                ]);
            });

            return ActionResult::success($subject);
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
