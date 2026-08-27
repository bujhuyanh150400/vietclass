<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassRepository;
use Illuminate\Support\Facades\DB;

final class ChangeClassStatusAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ClassRepository $classes,
    ) {}

    /**
     * Move a class between the running and finished states.
     *
     * Finishing a class closes every enrolment still open, so the roster reflects that
     * nobody is studying there any more, and stamps the end date. This is close to a
     * one-way door: reopening the class restores its status but not the enrolments that
     * were closed, exactly as in the fork.
     *
     * @return ActionResult<SchoolClass, AcademicError>
     */
    public function handle(int $classId, ClassStatus $status): ActionResult
    {
        try {
            $class = $this->classes->findById($classId);

            if (! $class instanceof SchoolClass) {
                throw new ActionError(
                    message: 'Không tìm thấy lớp học.',
                    code: AcademicError::ClassNotFound,
                );
            }

            if ($class->status === $status) {
                return ActionResult::success($class);
            }

            DB::transaction(function () use ($class, $status): void {
                if ($status === ClassStatus::Ended) {
                    $endsOn = $class->end_at ?? now();

                    $this->classes->endActiveEnrollments((int) $class->id, $endsOn);
                    $this->classes->update($class, [
                        'status' => $status,
                        'end_at' => $endsOn->toDateString(),
                    ]);

                    return;
                }

                $this->classes->update($class, ['status' => $status]);
            });

            return ActionResult::success($this->classes->findById($classId));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
