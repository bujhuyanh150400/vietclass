<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleInstanceRepository;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use Illuminate\Support\Carbon;

final class DeleteScheduleTemplateAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleInstanceRepository $instances,
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
     * A schedule can also be held by written sessions rather than by the calendar: a
     * future date can be materialised, and those rows are the record of somebody having
     * acted on that lesson. They are refused explicitly instead of being left to the
     * foreign key, which would surface as an unexpected system error carrying a
     * constraint name no caller can act on.
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

            $sessions = $this->instances->countForTemplate((int) $template->id);

            if ($sessions > 0) {
                throw new ActionError(
                    message: "Lịch cố định đã sinh {$sessions} buổi học, không thể xóa.",
                    code: ScheduleError::ScheduleTemplateHasSessions,
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
