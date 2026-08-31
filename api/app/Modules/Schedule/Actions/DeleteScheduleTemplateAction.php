<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use Illuminate\Support\Carbon;

final class DeleteScheduleTemplateAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
    ) {}

    /**
     * Remove a fixed schedule that has not started applying yet.
     *
     * A schedule whose `start_date` has arrived has already told people where to be, so
     * it is history and deleting it would erase the record of a slot that was taught.
     * Such a schedule is closed instead, which is `CloseScheduleTemplateAction`'s job.
     * Only a slot booked for a future date can be withdrawn as though it was never
     * booked; its teacher rows go with it through the cascade.
     *
     * `schedule_instances` does not exist yet, so no reference from a written session
     * can be checked here. When that table lands, this rule needs a second condition
     * refusing a schedule any session still points at.
     *
     * @return ActionResult<null, ScheduleError>
     */
    public function handle(int $templateId): ActionResult
    {
        try {
            $template = $this->templates->findById($templateId);

            if (! $template instanceof ScheduleTemplate) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch cố định.',
                    code: ScheduleError::ScheduleTemplateNotFound,
                );
            }

            $startedOn = Carbon::parse($template->start_date)->toDateString();

            if ($startedOn <= Carbon::today()->toDateString()) {
                throw new ActionError(
                    message: 'Lịch cố định đã có hiệu lực, hãy đóng lịch thay vì xóa.',
                    code: ScheduleError::ScheduleTemplateAlreadyStarted,
                );
            }

            $this->templates->delete($template);

            return ActionResult::success();
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
