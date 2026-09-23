<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;

final class GetGuardianAction
{
    /** Create the action with its guardian query collaborator. */
    public function __construct(private readonly ProfileRepository $profiles) {}

    /** Return one role-pure guardian or the standard not-found business failure. */
    public function handle(int $guardianId): ActionResult
    {
        try {
            $guardian = $this->profiles->findGuardian($guardianId);

            if (! $guardian instanceof Profile) {
                throw new ActionError(
                    message: 'Không tìm thấy phụ huynh.',
                    code: AcademicPersonError::GuardianNotFound,
                );
            }

            return ActionResult::success($guardian);
        } catch (ActionError $error) {
            return ActionResult::error(error: $error->code(), message: $error->getMessage());
        }
    }
}
