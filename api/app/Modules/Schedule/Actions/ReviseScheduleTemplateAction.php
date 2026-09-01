<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use App\Modules\Schedule\Support\ScheduleConflictChecker;
use App\Modules\Schedule\Support\ScheduleTeacherRoster;
use App\Modules\Schedule\Support\ScheduleTemplateGuard;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class ReviseScheduleTemplateAction
{
    /**
     * Create the action with the collaborators it validates and persists through.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleTemplateGuard $guard,
        private readonly ScheduleTeacherRoster $roster,
        private readonly ScheduleConflictChecker $conflicts,
    ) {}

    /**
     * Change a fixed schedule by closing the running version and opening a new one.
     *
     * A running schedule is never edited in place. Sessions that have already happened
     * were held at the day, time and room the row stated at the time; overwriting those
     * values would rewrite history and leave attendance and fees describing a slot that
     * never existed. So the old row is closed the day before the change takes effect
     * and a new row opens on the effective date, and the two rows together read as the
     * class's schedule history.
     *
     * Both rows are written in one transaction, because a gap or an overlap between
     * them is a state no reader should observe. The effective date may not be in the
     * past — a change cannot take effect on days that have already been taught. When it
     * falls on the old row's own start date the old row never applied for a single day,
     * so it is removed rather than left behind with `end_date` before `start_date`.
     *
     * @param  array{room_id: int|string, day_of_week: int|string|DayOfWeek, start_time: string, end_time: string, end_date?: string|null}  $attributes
     * @param  list<array{teacher_profile_id: int|string, role: int|string}>  $teachers
     * @return ActionResult<ScheduleTemplate, ScheduleError|AcademicError>
     */
    public function handle(
        int $templateId,
        string $effectiveDate,
        array $attributes,
        array $teachers,
        int $actorId,
    ): ActionResult {
        try {
            $template = $this->templates->findById($templateId);

            if (! $template instanceof ScheduleTemplate) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch cố định.',
                    code: ScheduleError::ScheduleTemplateNotFound,
                );
            }

            $effectiveOn = Carbon::parse($effectiveDate)->startOfDay();

            if ($effectiveOn->lessThan(Carbon::today())) {
                throw new ActionError(
                    message: 'Ngày hiệu lực không được ở quá khứ.',
                    code: ScheduleError::RevisionEffectiveDateInPast,
                );
            }

            $class = $this->guard->requireOpenClass((int) $template->class_id);
            $room = $this->guard->requireAvailableRoom((int) $attributes['room_id']);

            $dayOfWeek = $attributes['day_of_week'] instanceof DayOfWeek
                ? $attributes['day_of_week']
                : DayOfWeek::from((int) $attributes['day_of_week']);
            $startTime = Carbon::parse($attributes['start_time'])->format('H:i:s');
            $endTime = Carbon::parse($attributes['end_time'])->format('H:i:s');
            $startDate = $effectiveOn->toDateString();
            $endDate = ($attributes['end_date'] ?? null) === null
                ? null
                : Carbon::parse($attributes['end_date'])->toDateString();

            $this->guard->assertDatesFitClass(
                class: $class,
                startDate: $startDate,
                endDate: $endDate,
            );

            $roster = $this->roster->resolve($teachers);

            $this->conflicts->assertTemplateSlotIsFree(
                roomId: (int) $room->id,
                dayOfWeek: $dayOfWeek,
                startTime: $startTime,
                endTime: $endTime,
                startDate: $startDate,
                endDate: $endDate,
                teacherProfileIds: array_column($roster, 'teacher_profile_id'),
                excludeTemplateId: (int) $template->id,
            );

            // Sessions already written under the version being replaced are left out: they
            // are this schedule's own history, not somebody else holding the room.
            $this->conflicts->assertTemplateSlotIsFreeOfWrittenSessions(
                roomId: (int) $room->id,
                dayOfWeek: $dayOfWeek,
                startTime: $startTime,
                endTime: $endTime,
                startDate: $startDate,
                endDate: $endDate,
                teacherProfileIds: array_column($roster, 'teacher_profile_id'),
                excludeTemplateId: (int) $template->id,
            );

            $revised = DB::transaction(function () use (
                $template,
                $class,
                $room,
                $dayOfWeek,
                $startTime,
                $endTime,
                $startDate,
                $endDate,
                $roster,
                $actorId,
                $effectiveOn,
            ): ScheduleTemplate {
                $this->closeOrDiscardPreviousVersion(
                    template: $template,
                    effectiveOn: $effectiveOn,
                    actorId: $actorId,
                );

                return $this->templates->replaceTeachers(
                    $this->templates->create([
                        'class_id' => $class->id,
                        'day_of_week' => $dayOfWeek,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'room_id' => $room->id,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'created_by' => $actorId,
                        'updated_by' => null,
                    ]),
                    $roster,
                );
            });

            return ActionResult::success($this->templates->findById((int) $revised->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Retire the version being replaced: close it the day before the revision applies,
     * or remove it when it never applied at all.
     *
     * An effective date on or before the old row's start date means the old version was
     * in force for no days, so there is no history to keep and nothing to close — the
     * row is deleted, taking its teacher rows with it. Otherwise the closing date only
     * ever shortens the old row: a schedule that already ended earlier is not silently
     * extended to the day before this revision.
     */
    private function closeOrDiscardPreviousVersion(
        ScheduleTemplate $template,
        Carbon $effectiveOn,
        int $actorId,
    ): void {
        $previousStart = Carbon::parse($template->start_date)->startOfDay();

        if ($effectiveOn->lessThanOrEqualTo($previousStart)) {
            $this->templates->delete($template);

            return;
        }

        $closeOn = $effectiveOn->copy()->subDay()->toDateString();
        $previousEnd = $template->end_date === null
            ? null
            : Carbon::parse($template->end_date)->toDateString();

        $this->templates->update($template, [
            'end_date' => $previousEnd !== null && $previousEnd < $closeOn ? $previousEnd : $closeOn,
            'updated_by' => $actorId,
        ]);
    }
}
