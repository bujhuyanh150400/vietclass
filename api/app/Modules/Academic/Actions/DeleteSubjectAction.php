<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Repositories\SubjectRepository;
use Illuminate\Support\Facades\DB;

final class DeleteSubjectAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly SubjectRepository $subjects,
    ) {}

    /**
     * Remove a subject only after locking it and checking every class reference.
     *
     * Every class counts here, not only the running ones. The subject lock also
     * serializes deletion with class creation and subject-set edits.
     *
     * @return ActionResult<null, AcademicError>
     */
    public function handle(int $subjectId): ActionResult
    {
        try {
            DB::transaction(function () use ($subjectId): void {
                $subject = $this->subjects->findByIdForUpdate($subjectId);

                if (! $subject instanceof Subject) {
                    throw new ActionError(
                        message: 'Không tìm thấy môn học.',
                        code: AcademicError::SubjectNotFound,
                    );
                }

                $classes = $this->subjects->countClasses($subject);

                if ($classes > 0) {
                    throw new ActionError(
                        message: "Môn học đang được dùng bởi {$classes} lớp, không thể xóa.",
                        code: AcademicError::SubjectInUse,
                    );
                }

                $this->subjects->delete($subject);
            });

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
