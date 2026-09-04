<?php

namespace App\Modules\System\Actions;

use App\Core\Data\ActionResult;
use App\Modules\Identity\Models\User;
use App\Modules\System\Repositories\SystemSettingRepository;

final class UpdateFileQuotasAction
{
    /** Create the action with its quota setting store. */
    public function __construct(
        private readonly SystemSettingRepository $settings,
    ) {}

    /**
     * Persist the supplied role quotas and record the administrator who changed them.
     *
     * @param  array{admin: int, teacher: int, student: int, guardian: int}  $quotas
     * @return ActionResult<array{admin: int, teacher: int, student: int, guardian: int}, never>
     */
    public function handle(array $quotas, User $actor): ActionResult
    {
        return ActionResult::success($this->settings->updateFileQuotas(
            quotas: $quotas,
            actor: $actor,
        ));
    }
}
