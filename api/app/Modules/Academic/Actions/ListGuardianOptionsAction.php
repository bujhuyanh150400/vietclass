<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;
use Illuminate\Database\Eloquent\Collection;

final class ListGuardianOptionsAction
{
    /**
     * Create the action with its query collaborator.
     */
    public function __construct(
        private readonly ProfileRepository $profiles,
    ) {}

    /**
     * Return the guardians a student may be linked to.
     *
     * Profiles that do not already act as somebody's guardian are excluded in the
     * repository rather than filtered by the caller, so a guardian picker never has
     * to explain why the teacher directory is in its results.
     *
     * @return ActionResult<Collection<int, Profile>, AcademicPersonError>
     */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->profiles->guardianOptions($query));
    }
}
