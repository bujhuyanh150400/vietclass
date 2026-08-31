<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use App\Modules\Schedule\Support\ScheduleConflictChecker;
use App\Modules\Schedule\Support\ScheduleTeacherRoster;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class SetScheduleTemplateTeachersAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleTeacherRoster $roster,
        private readonly ScheduleConflictChecker $conflicts,
    ) {}

    /**
     * Replace the whole teacher list of a fixed schedule.
     *
     * Who teaches a slot is not part of what makes the slot itself, so changing the
     * list is an ordinary edit rather than a revision: the day, the time, the room and
     * the validity window are untouched, and no second row is opened. The list is
     * replaced whole because the one-main-teacher rule is a property of the list, not
     * of any single row in it — adding and removing one person at a time would pass
     * through states the partial unique index refuses.
     *
     * The new people are put through the double-booking check as well, with this
     * schedule left out of the comparison, so a teacher cannot be moved into a slot
     * that already has them somewhere else.
     *
     * @param  list<array{teacher_profile_id: int|string, role: int|string}>  $teachers
     * @return ActionResult<ScheduleTemplate, ScheduleError|AcademicError>
     */
    public function handle(int $templateId, array $teachers, int $actorId): ActionResult
    {
        try {
            $template = $this->templates->findById($templateId);

            if (! $template instanceof ScheduleTemplate) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch cố định.',
                    code: ScheduleError::ScheduleTemplateNotFound,
                );
            }

            $roster = $this->roster->resolve($teachers);

            $this->conflicts->assertTemplateSlotIsFree(
                roomId: (int) $template->room_id,
                dayOfWeek: $template->day_of_week,
                startTime: (string) $template->start_time,
                endTime: (string) $template->end_time,
                startDate: Carbon::parse($template->start_date)->toDateString(),
                endDate: $template->end_date === null
                    ? null
                    : Carbon::parse($template->end_date)->toDateString(),
                teacherProfileIds: array_column($roster, 'teacher_profile_id'),
                excludeTemplateId: (int) $template->id,
            );

            DB::transaction(function () use ($template, $roster, $actorId): void {
                $this->templates->replaceTeachers($template, $roster);
                $this->templates->update($template, ['updated_by' => $actorId]);
            });

            return ActionResult::success($this->templates->findById((int) $template->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
