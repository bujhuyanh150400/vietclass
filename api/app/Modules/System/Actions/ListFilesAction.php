<?php

namespace App\Modules\System\Actions;

use App\Core\Data\ActionResult;
use App\Core\Data\ListQuery;
use App\Modules\System\Repositories\ManagedFileRepository;
use App\Modules\Auth\Models\User;

final class ListFilesAction
{
    /** Create the list action with its visible-file query collaborator. */
    public function __construct(
        private readonly ManagedFileRepository $files,
    ) {}

    /** Return one page of files visible to the caller under the validated filters. */
    public function handle(User $actor, ListQuery $query): ActionResult
    {
        return ActionResult::success($this->files->paginateVisible(actor: $actor, query: $query));
    }
}
