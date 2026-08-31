<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use Illuminate\Support\Carbon;

final class CloseScheduleTemplateAction
{
    /**
     * Create the action with its persistence collaborator.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
    ) {}

    /**
     * Stop a fixed schedule from applying after the given date, without replacing it.
     *
     * This is the path for a class that simply drops a weekly slot. Revision is the
     * path for one that swaps a slot for a different one, and it opens a new row;
     * closing opens nothing, so the class is left with one slot fewer from the day
     * after the date given here.
     *
     * The closing date may not fall before the day the schedule started applying: a row
     * with `end_date` before `start_date` describes a validity window that never
     * existed, and the projection would read it as a schedule that both ran and did
     * not. Removing such a schedule is `DeleteScheduleTemplateAction`'s job.
     *
     * @return ActionResult<ScheduleTemplate, ScheduleError>
     */
    public function handle(int $templateId, string $endDate, int $actorId): ActionResult
    {
        try {
            $template = $this->templates->findById($templateId);

            if (! $template instanceof ScheduleTemplate) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch cố định.',
                    code: ScheduleError::ScheduleTemplateNotFound,
                );
            }

            $closeOn = Carbon::parse($endDate)->toDateString();
            $startedOn = Carbon::parse($template->start_date)->toDateString();

            if ($closeOn < $startedOn) {
                throw new ActionError(
                    message: "Ngày đóng lịch không được trước ngày lịch bắt đầu áp dụng {$startedOn}.",
                    code: ScheduleError::CloseDateBeforeStartDate,
                );
            }

            $this->templates->update($template, [
                'end_date' => $closeOn,
                'updated_by' => $actorId,
            ]);

            return ActionResult::success($this->templates->findById((int) $template->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
