<?php

namespace App\Modules\System\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\Auth\Models\User;
use App\Modules\Auth\Repositories\UserRepository;

final class ListFileOwnerOptionsAction
{
    /** Create the owner-options action with its identity query collaborator. */
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    /** Return the administrator-facing account options that can own uploaded files. */
    public function handle(User $actor, ListQuery $query): ActionResult
    {
        return ActionResult::success($this->users->options($query));
    }
}
