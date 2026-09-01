<?php

namespace App\Modules\Schedule\Support;

use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleInstanceRepository;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use Illuminate\Support\Carbon;

/**
 * Refuses a schedule that would put a room or a person in two places at once.
 *
 * The block is hard: there is no override flag, so this class only ever throws or
 * stays silent. It throws `ActionError`, which the calling Action converts into a
 * failed `ActionResult` at its own error boundary.
 *
 * All four comparisons the design calls for are here — fixed schedule against fixed
 * schedule, fixed schedule against a written session, written session against written
 * session, and written session against a projected one. Each is a method of its own named
 * after the pair it compares, rather than one method with a widened signature: the two
 * sides differ in shape, since a fixed schedule is a recurrence over a date range and a
 * session is one date, and collapsing that into a single signature would hide which
 * question is being asked.
 *
 * Two rules run through every one of them. A cancelled session occupies neither its room
 * nor anybody's time, so it can never be the reason a slot is refused. And a written row
 * always wins over a projected one, which is why the projected-session comparison ignores
 * the dates a written row already covers.
 */
final class ScheduleConflictChecker
{
    /**
     * Create the checker with the two stores it compares candidate slots against.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleInstanceRepository $instances,
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

        $this->throwFor(
            occupant: $this->describe($clash),
            occupiesCandidateRoom: (int) $clash->room_id === $roomId,
        );
    }

    /**
     * Refuse a weekly slot that a written session already occupies on any date the slot
     * applies to.
     *
     * This is the comparison a fixed schedule needs against the calendar rather than
     * against other schedules: once sessions can be moved, a room may be held on one
     * Monday by a lesson no schedule projects there any more, and only the written row
     * knows about it. The candidate is a recurrence, so every date its window covers is
     * compared, and a NULL `end_date` means every date from its start onward.
     *
     * A cancelled session is not in the way: calling a lesson off releases its room and
     * its people.
     *
     * `$excludeTemplateId` leaves out the sessions the candidate schedule produced itself,
     * so revising a schedule is not blocked by the lessons its own earlier version wrote.
     *
     * @param  list<int>  $teacherProfileIds
     *
     * @throws ActionError when a written session holds the room or one of the people
     */
    public function assertTemplateSlotIsFreeOfWrittenSessions(
        int $roomId,
        DayOfWeek $dayOfWeek,
        string $startTime,
        string $endTime,
        string $startDate,
        ?string $endDate,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): void {
        $clash = $this->instances->findFirstConflictingWithTemplateSlot(
            roomId: $roomId,
            dayOfWeek: $dayOfWeek,
            startTime: $startTime,
            endTime: $endTime,
            startDate: $startDate,
            endDate: $endDate,
            teacherProfileIds: $teacherProfileIds,
            excludeTemplateId: $excludeTemplateId,
        );

        $this->refuse($clash, $roomId);
    }

    /**
     * Refuse a lesson that another written session already occupies the room or one of
     * the people for.
     *
     * One date on both sides, so this is the plainest of the four comparisons. It is the
     * one that has the last word: both sides are rows somebody decided on, and a written
     * row always wins over a projected one, so no projection can talk either of them out
     * of the way.
     *
     * `$excludeInstanceId` leaves the lesson being edited out of the comparison.
     *
     * @param  list<int>  $teacherProfileIds
     *
     * @throws ActionError when another written session holds the room or one of the people
     */
    public function assertSessionSlotIsFreeOfWrittenSessions(
        int $roomId,
        string $date,
        string $startTime,
        string $endTime,
        array $teacherProfileIds,
        ?int $excludeInstanceId = null,
    ): void {
        $clash = $this->instances->findFirstConflictingWithSession(
            roomId: $roomId,
            date: $date,
            startTime: $startTime,
            endTime: $endTime,
            teacherProfileIds: $teacherProfileIds,
            excludeInstanceId: $excludeInstanceId,
        );

        $this->refuse($clash, $roomId);
    }

    /**
     * Refuse a lesson that a fixed schedule projects a session onto, room or person.
     *
     * A projected session is nobody's decision yet, but it is what the calendar shows and
     * what the class turns up for, so writing a lesson over one would double-book a real
     * room. The dates a schedule already has a written row on project nothing and are
     * excluded, which is not a softening of the rule but the other half of it: those dates
     * belong to the written-against-written comparison, and without the exclusion a lesson
     * would be reported as clashing with the projected session it itself replaced.
     *
     * `$excludeTemplateId` leaves one schedule out, which is what a lesson being moved
     * inside its own schedule's slot needs.
     *
     * @param  list<int>  $teacherProfileIds
     *
     * @throws ActionError when a projected session holds the room or one of the people
     */
    public function assertSessionSlotIsFreeOfProjectedSessions(
        int $roomId,
        string $date,
        string $startTime,
        string $endTime,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): void {
        $clash = $this->templates->findFirstProjectingOnto(
            date: $date,
            startTime: $startTime,
            endTime: $endTime,
            roomId: $roomId,
            teacherProfileIds: $teacherProfileIds,
            excludeTemplateId: $excludeTemplateId,
        );

        if (! $clash instanceof ScheduleTemplate) {
            return;
        }

        $this->throwFor(
            occupant: $this->describe($clash),
            occupiesCandidateRoom: (int) $clash->room_id === $roomId,
        );
    }

    /**
     * Throw when a written session is in the way, and stay silent when none is.
     *
     * Which of the two reasons matched is read off the row rather than asked of the
     * database a second time: the candidate room is the only room that can satisfy the
     * room branch, so a row holding a different room can only have matched on a person.
     */
    private function refuse(?ScheduleInstance $clash, int $roomId): void
    {
        if (! $clash instanceof ScheduleInstance) {
            return;
        }

        $this->throwFor(
            occupant: $this->describeSession($clash),
            occupiesCandidateRoom: (int) $clash->room_id === $roomId,
        );
    }

    /**
     * Report the clash as the business failure whose reason it actually is.
     *
     * Both reasons are refusals of the same strength — there is no override flag for
     * either — and they are kept apart only so the caller is told which of the two to
     * change.
     *
     * @throws ActionError always
     */
    private function throwFor(string $occupant, bool $occupiesCandidateRoom): void
    {
        if ($occupiesCandidateRoom) {
            throw new ActionError(
                message: 'Phòng học đã có '.$occupant.', không thể xếp trùng.',
                code: ScheduleError::RoomConflict,
            );
        }

        throw new ActionError(
            message: 'Giáo viên đã có '.$occupant.', không thể xếp trùng.',
            code: ScheduleError::TeacherConflict,
        );
    }

    /**
     * Describe the written session holding the slot, naming the class and the moment so
     * the caller knows which lesson to look at.
     */
    private function describeSession(ScheduleInstance $clash): string
    {
        $classCode = $clash->schoolClass?->code ?? '(không rõ)';

        return sprintf(
            'buổi học của lớp %s ngày %s %s–%s',
            $classCode,
            Carbon::parse($clash->date)->format('d/m/Y'),
            $this->hourAndMinute($clash->start_time),
            $this->hourAndMinute($clash->end_time),
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
