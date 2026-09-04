<?php

namespace App\Modules\System\Actions;

use App\Core\Data\ActionResult;
use App\Modules\System\Repositories\SystemSettingRepository;

final class GetFileQuotasAction
{
    /** Create the action with its quota setting source. */
    public function __construct(
        private readonly SystemSettingRepository $settings,
    ) {}

    /**
     * Return the current role quotas, including fixed defaults before first update.
     *
     * @return ActionResult<array{admin: int, teacher: int, student: int, guardian: int}, never>
     */
    public function handle(): ActionResult
    {
        return ActionResult::success($this->settings->fileQuotas());
    }
}
