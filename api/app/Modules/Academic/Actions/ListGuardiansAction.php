<?php

namespace App\Modules\Academic\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListGuardiansAction
{
    /** Create the action with its guardian query collaborator. */
    public function __construct(private readonly ProfileRepository $profiles) {}

    /** Return one page of role-pure guardian records. */
    public function handle(ListQuery $query): ActionResult
    {
        return ActionResult::success($this->profiles->paginateGuardians($query));
    }
}
