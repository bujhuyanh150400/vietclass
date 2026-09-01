<?php

namespace App\Modules\Schedule\Support;

use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleInstanceRepository;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use Illuminate\Support\Carbon;

/**
 * Answers "what is on the calendar between these two dates" without the calendar having
 * been generated first.
 *
 * The fork generated twelve weeks of rows ahead with a queued job, then needed three
 * prune routines to clear the rows its own schedule edits had orphaned. Nothing is
 * generated ahead here: the fixed schedules are walked over the requested range in PHP,
 * and a row exists only once somebody has acted on that lesson. There is no look-ahead
 * window, so there is no rubbish to collect.
 *
 * Reading is the union of two sets — the rows written inside the range, and the projected
 * sessions the fixed schedules cast onto it. Where the two describe the same lesson the
 * written row wins, without exception: it is the one that records what somebody decided.
 *
 * The database is asked a fixed number of questions, whatever the range: the fixed
 * schedules overlapping it and the written rows inside it, plus one eager load per name
 * each side reports — the room, the teachers, and on the written side the class and the
 * subject. Everything after that is arithmetic. Nothing queries inside the day loop, so a
 * three-month range costs what a one-day range costs, and that constancy is what
 * `ScheduleProjectionTest` pins.
 */
final class ScheduleProjector
{
    /**
     * Create the projector with the two stores it reads the calendar from.
     */
    public function __construct(
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleInstanceRepository $instances,
    ) {}

    /**
     * Return every session between two inclusive dates, ordered as a calendar reads.
     *
     * Each filter narrows both sets on the same meaning — a class, a person whatever
     * their role on the lesson, a room — so a filtered read stays the union of the same
     * two things rather than becoming a different question for each set.
     *
     * @return list<ProjectedSession>
     */
    public function project(
        string $from,
        string $to,
        ?int $classId = null,
        ?int $teacherProfileId = null,
        ?int $roomId = null,
    ): array {
        $written = $this->instances->listInRange(
            from: $from,
            to: $to,
            classId: $classId,
            teacherProfileId: $teacherProfileId,
            roomId: $roomId,
        );

        $sessions = array_map(
            static fn (ScheduleInstance $instance): ProjectedSession => ProjectedSession::fromInstance($instance),
            $written->all(),
        );

        $templates = $this->templates->listOverlappingRange(
            from: $from,
            to: $to,
            classId: $classId,
            teacherProfileId: $teacherProfileId,
            roomId: $roomId,
        );

        foreach ($this->projectTemplates($templates->all(), $from, $to, $this->writtenKeys($sessions)) as $session) {
            $sessions[] = $session;
        }

        usort($sessions, $this->calendarOrder());

        return $sessions;
    }

    /**
     * Return the lessons already written, keyed by the projected session each replaces,
     * so the walk below can recognise a day it must stay silent about.
     *
     * A row that no fixed schedule produced has no projected twin and contributes no key.
     *
     * @param  list<ProjectedSession>  $sessions
     * @return array<string, true>
     */
    private function writtenKeys(array $sessions): array
    {
        $keys = [];

        foreach ($sessions as $session) {
            $key = $session->projectionKey();

            if ($key !== null) {
                $keys[$key] = true;
            }
        }

        return $keys;
    }

    /**
     * Walk the range one day at a time and cast every fixed schedule that applies on it.
     *
     * The schedules are bucketed by weekday first so each day only looks at the ones that
     * could possibly land on it, and the whole walk touches nothing but values already in
     * memory.
     *
     * @param  list<ScheduleTemplate>  $templates
     * @param  array<string, true>  $writtenKeys
     * @return list<ProjectedSession>
     */
    private function projectTemplates(array $templates, string $from, string $to, array $writtenKeys): array
    {
        $byWeekday = [];

        foreach ($templates as $template) {
            $byWeekday[$template->day_of_week->value][] = $template;
        }

        $sessions = [];
        $cursor = Carbon::parse($from)->startOfDay();
        $last = Carbon::parse($to)->startOfDay();

        while ($cursor->lessThanOrEqualTo($last)) {
            $date = $cursor->toDateString();

            foreach ($byWeekday[DayOfWeek::fromDate($cursor)->value] ?? [] as $template) {
                if (! $this->appliesOn($template, $date)) {
                    continue;
                }

                // A written row wins. The projected session it replaces is dropped here
                // rather than filtered out afterwards, so no caller can ever see both.
                if (isset($writtenKeys[$template->id.'|'.$date])) {
                    continue;
                }

                $sessions[] = ProjectedSession::fromTemplate(
                    template: $template,
                    date: $date,
                    subjectId: (int) $template->class_subject_id,
                    subjectName: (string) $template->class_subject_name,
                );
            }

            $cursor = $cursor->addDay();
        }

        return $sessions;
    }

    /**
     * Report whether a fixed schedule reaches a given date.
     *
     * Four dates bound a projected session, and all four are applied here. The schedule
     * opens on `start_date` and the class opens on `start_at`, so the later of the two is
     * the first day anything can be projected. The schedule closes on `end_date` and the
     * class on `end_at`, so the earlier of the two is the last — and either may be NULL,
     * meaning that side sets no upper bound, which is how an open-ended schedule ends up
     * stopping when its class does rather than running forever.
     */
    private function appliesOn(ScheduleTemplate $template, string $date): bool
    {
        $opensOn = max(
            $this->dateString($template->start_date),
            $this->dateString($template->class_start_at),
        );

        if ($date < $opensOn) {
            return false;
        }

        $closesOn = array_filter(
            [
                $template->end_date === null ? null : $this->dateString($template->end_date),
                $template->class_end_at === null ? null : $this->dateString($template->class_end_at),
            ],
            static fn (?string $bound): bool => $bound !== null,
        );

        return $closesOn === [] || $date <= min($closesOn);
    }

    /**
     * Normalise a stored date, whether it arrived as a Carbon instance from a cast or as
     * a raw string from the joined class columns, to the `YYYY-MM-DD` form the walk
     * compares.
     */
    private function dateString(mixed $value): string
    {
        return Carbon::parse($value)->toDateString();
    }

    /**
     * Return the comparison that puts sessions in the order a calendar reads them.
     *
     * Date and start time carry the meaning. The identifiers behind them only make the
     * order total, so two lessons at the same moment come back the same way every call
     * and a caller can compare two responses; a projected session sorts before a written
     * one at the same time because it has no identifier to sort by.
     *
     * @return callable(ProjectedSession, ProjectedSession): int
     */
    private function calendarOrder(): callable
    {
        return static fn (ProjectedSession $first, ProjectedSession $second): int => [
            $first->date, $first->startTime, $first->id ?? 0, $first->templateId ?? 0,
        ] <=> [
            $second->date, $second->startTime, $second->id ?? 0, $second->templateId ?? 0,
        ];
    }
}
