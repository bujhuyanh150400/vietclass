<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;
use App\Modules\Academic\Services\SubjectUsageGuard;
use Illuminate\Support\Facades\DB;

final class ToggleSubjectActiveAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
        private readonly SubjectUsageGuard $usage,
    ) {}

    /**
     * Lock or unlock a subject for use by new classes.
     *
     * Locking is refused while a running class still teaches the subject, because that
     * class would be left pointing at something no longer offered. Finished classes do
     * not block it: they are history, and retiring a subject is exactly what should
     * happen once its last class ends. Unlocking is always allowed.
     *
     * @return ActionResult<Subject, AcademicError>
     */
    public function handle(int $subjectId, bool $isActive): ActionResult
    {
        try {
            $subject = DB::transaction(function () use ($subjectId, $isActive): Subject {
                $subject = $this->subjects->findByIdForUpdate($subjectId);

                if (! $subject instanceof Subject) {
                    throw new ActionError(
                        message: 'Không tìm thấy môn học.',
                        code: AcademicError::SubjectNotFound,
                    );
                }

                $this->usage->ensureCanUpdate(
                    subject: $subject,
                    gradeLevels: array_map('intval', $subject->grade_levels ?? []),
                    isActive: $isActive,
                );

                return $this->subjects->update($subject, ['is_active' => $isActive]);
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
