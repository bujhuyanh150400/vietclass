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

final class CreateScheduleTemplateAction
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
     * Open a weekly slot for a class.
     *
     * Everything the slot depends on is verified before a row exists: the class is
     * still running, the room is still in circulation, the teacher list names exactly
     * one main teacher and nobody who has left, the validity window sits inside the
     * class's own dates, and neither the room nor any of the named people is already
     * busy at that time. The schedule and its teacher rows are then written together,
     * because a schedule with no teachers is a state no reader should observe.
     *
     * `updated_by` is written as NULL rather than left out: nobody has changed this
     * schedule yet, and stating that is what makes the column trustworthy elsewhere.
     *
     * @param  array{room_id: int|string, day_of_week: int|string|DayOfWeek, start_time: string, end_time: string, start_date: string, end_date?: string|null}  $attributes
     * @param  list<array{teacher_profile_id: int|string, role: int|string}>  $teachers
     * @return ActionResult<ScheduleTemplate, ScheduleError|AcademicError>
     */
    public function handle(int $classId, array $attributes, array $teachers, int $actorId): ActionResult
    {
        try {
            $class = $this->guard->requireOpenClass($classId);
            $room = $this->guard->requireAvailableRoom((int) $attributes['room_id']);

            $dayOfWeek = $attributes['day_of_week'] instanceof DayOfWeek
                ? $attributes['day_of_week']
                : DayOfWeek::from((int) $attributes['day_of_week']);
            $startTime = Carbon::parse($attributes['start_time'])->format('H:i:s');
            $endTime = Carbon::parse($attributes['end_time'])->format('H:i:s');
            $startDate = Carbon::parse($attributes['start_date'])->toDateString();
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
            );

            $template = DB::transaction(fn (): ScheduleTemplate => $this->templates->replaceTeachers(
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
            ));

            return ActionResult::success($this->templates->findById((int) $template->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }
}
