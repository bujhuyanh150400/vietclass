<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;

final class ToggleSubjectActiveAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
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
            $subject = $this->subjects->findById($subjectId);

            if (! $subject instanceof Subject) {
                throw new ActionError(
                    message: 'Không tìm thấy môn học.',
                    code: AcademicError::SubjectNotFound,
                );
            }

            if (! $isActive) {
                $activeClasses = $this->subjects->countClasses($subject, ClassStatus::Active);

                if ($activeClasses > 0) {
                    throw new ActionError(
                        message: "Môn học đang được dùng bởi {$activeClasses} lớp đang hoạt động, không thể khóa.",
                        code: AcademicError::SubjectInUse,
                    );
                }
            }

            return ActionResult::success(
                $this->subjects->update($subject, ['is_active' => $isActive]),
            );
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
