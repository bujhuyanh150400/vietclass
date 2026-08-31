<?php

namespace App\Modules\Schedule\Support;

use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;

/**
 * Refuses a schedule that would put a room or a person in two places at once.
 *
 * The block is hard: there is no override flag, so this class only ever throws or
 * stays silent. It throws `ActionError`, which the calling Action converts into a
 * failed `ActionResult` at its own error boundary.
 *
 * The design has four comparisons to make in total — fixed schedule against fixed
 * schedule, fixed schedule against a written session, written session against written
 * session, and written session against a projected one. Only the first exists while
 * `schedule_instances` does not, so each comparison gets its own method named after
 * the pair it compares; the later three are added beside this one rather than by
 * widening its signature.
 */
final class ScheduleConflictChecker
{
    /**
     * Create the checker with the store it compares candidate slots against.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
    ) {}

    /**
     * Refuse a weekly slot that an existing fixed schedule already occupies.
     *
     * Two things make a clash: the room is taken, or one of the people named is
     * already teaching elsewhere at that time. Role plays no part — an assistant
     * cannot be in two rooms at once any more than a main teacher can — so the whole
     * teacher list is compared regardless of the role each person holds on either
     * side.
     *
     * `$excludeTemplateId` leaves one schedule out of the comparison, which every edit
     * path needs so a schedule is not reported as clashing with the version of itself
     * that is being replaced.
     *
     * @param  list<int>  $teacherProfileIds
     *
     * @throws ActionError when the slot is already taken
     */
    public function assertTemplateSlotIsFree(
        int $roomId,
        DayOfWeek $dayOfWeek,
        string $startTime,
        string $endTime,
        string $startDate,
        ?string $endDate,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): void {
        $clash = $this->templates->findFirstConflicting(
            roomId: $roomId,
            dayOfWeek: $dayOfWeek,
            startTime: $startTime,
            endTime: $endTime,
            startDate: $startDate,
            endDate: $endDate,
            teacherProfileIds: $teacherProfileIds,
            excludeTemplateId: $excludeTemplateId,
        );

        if (! $clash instanceof ScheduleTemplate) {
            return;
        }

        // Which of the two reasons matched is decided from the row itself rather than
        // by running a second query: the candidate room is the only room that can make
        // the room branch true, so a different room means the teacher branch matched.
        if ((int) $clash->room_id === $roomId) {
            throw new ActionError(
                message: 'Phòng học đã có '.$this->describe($clash).', không thể xếp trùng.',
                code: ScheduleError::RoomConflict,
            );
        }

        throw new ActionError(
            message: 'Giáo viên đã có '.$this->describe($clash).', không thể xếp trùng.',
            code: ScheduleError::TeacherConflict,
        );
    }

    /**
     * Describe the schedule holding the slot, so the caller is told what is in the way
     * instead of only that something is.
     */
    private function describe(ScheduleTemplate $clash): string
    {
        $classCode = $clash->schoolClass?->code ?? '(không rõ)';

        return sprintf(
            'lịch cố định của lớp %s vào %s %s–%s',
            $classCode,
            $clash->day_of_week->label(),
            $this->hourAndMinute($clash->start_time),
            $this->hourAndMinute($clash->end_time),
        );
    }

    /**
     * Trim a stored `HH:MM:SS` time down to the `HH:MM` a reader is shown.
     */
    private function hourAndMinute(mixed $time): string
    {
        return substr((string) $time, 0, 5);
    }
}
