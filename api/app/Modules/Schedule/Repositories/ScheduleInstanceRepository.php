<?php

namespace App\Modules\Schedule\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleInstance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ScheduleInstanceRepository extends BaseRepository
{
    /** This repository is backed by the ScheduleInstance model. */
    protected function modelClass(): ?string
    {
        return ScheduleInstance::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return every written session falling inside a date range, ordered the way the
     * calendar reads, with each one's teacher list and the names it reports already
     * loaded.
     *
     * Both bounds are inclusive. Everything a session names is eager-loaded rather than
     * left to be walked per row because the projection merges these rows with projected
     * ones and must answer for a whole range in a query count that does not grow with the
     * number of rows in it. Each load names its columns: a calendar needs a class code and
     * two names, not whole rows from four tables.
     *
     * The class and the room are loaded whatever state they are in. A lesson in a room
     * under maintenance, or one belonging to a class that has already finished, is an
     * ordinary thing to find on a calendar, and it is precisely what a reader resolving
     * these names from the filtered `options` endpoints would be unable to name.
     *
     * Each filter is applied to the session's own columns, not to the fixed schedule it
     * came from: once a session exists it is the authority on where it happens and who
     * teaches it, and later phases let both be changed away from the schedule's values.
     *
     * @return Collection<int, ScheduleInstance>
     */
    public function listInRange(
        string $from,
        string $to,
        ?int $classId = null,
        ?int $teacherProfileId = null,
        ?int $roomId = null,
    ): Collection {
        return $this->modelQuery()
            ->with([
                'schoolClass:id,code,name',
                'subject:id,name',
                'room:id,name',
                'teachers.teacher.profile:id,full_name',
            ])
            ->whereBetween('date', [$from, $to])
            ->when(
                $classId !== null,
                fn (Builder $builder): Builder => $builder->where('class_id', $classId),
            )
            ->when(
                $roomId !== null,
                fn (Builder $builder): Builder => $builder->where('room_id', $roomId),
            )
            ->when(
                $teacherProfileId !== null,
                fn (Builder $builder): Builder => $builder->whereHas(
                    'teachers',
                    fn (Builder $teachers): Builder => $teachers->where('teacher_profile_id', $teacherProfileId),
                ),
            )
            ->orderBy('date')
            ->orderBy('start_time')
            ->orderBy('id')
            ->get();
    }

    /**
     * Find one written session with the relations a detail view reports, or null when no
     * session carries that identifier.
     *
     * Only written sessions have an identifier at all: a projected session is addressed
     * by its `(template_id, date)` pair and is read through the projection, so a lookup
     * by identifier can never answer with one.
     */
    public function findById(int $sessionId): ?ScheduleInstance
    {
        return $this->modelQuery()
            ->with([
                'schoolClass:id,code,name',
                'subject:id,name',
                'room:id,name,capacity,status',
                'teachers.teacher.profile:id,full_name',
                'teachers.replaces.profile:id,full_name',
                'mainTeacher.teacher.profile:id,full_name',
                'assistantTeachers.teacher.profile:id,full_name',
            ])
            ->find($sessionId);
    }

    /**
     * Find the written session a fixed schedule produced on one date, or null while that
     * session is still only projected.
     *
     * This is the lookup `UNIQUE (template_id, date)` exists for: it answers both
     * "has this projected session been materialised" and, after a collision on that
     * index, "which row won".
     */
    public function findByTemplateAndDate(int $templateId, string $date): ?ScheduleInstance
    {
        return $this->modelQuery()
            ->where('template_id', $templateId)
            ->where('date', $date)
            ->first();
    }

    /**
     * Count the written sessions a fixed schedule has produced.
     *
     * Deleting a fixed schedule is refused while this is above zero: those rows are the
     * record of lessons somebody has already acted on, and the foreign key would refuse
     * the delete anyway with a constraint name no caller can act on.
     */
    public function countForTemplate(int $templateId): int
    {
        return $this->modelQuery()
            ->where('template_id', $templateId)
            ->count();
    }

    /**
     * Find the first written session that a weekly slot would collide with anywhere in
     * its validity window, or null when the whole window is clear.
     *
     * This is the awkward comparison of the four: the candidate is not one lesson but a
     * recurrence, so it has to be held against every written row the window covers and
     * the weekday match becomes a predicate on the row's own date. On PostgreSQL that is
     * `EXTRACT(ISODOW FROM date)`, which no index answers, so the clauses are ordered to
     * leave it last: the room or the teacher narrows first — `(room_id, date, start_time,
     * end_time)` serves the room branch — then the date range, and the weekday is a cheap
     * residual over what little survives. No functional index is added for it; that needs
     * a measurement first, not a guess.
     *
     * A NULL `end_date` is an open interval, not a missing value, so an open-ended slot is
     * compared against every written row from its start date onward.
     *
     * Cancelled sessions are left out: a lesson somebody called off holds neither its room
     * nor anybody's time, so it cannot be the reason a slot is refused.
     *
     * `$excludeTemplateId` drops the rows the candidate schedule produced itself, which is
     * what an edit needs — a schedule must not be reported as clashing with the sessions
     * its own earlier version materialised.
     *
     * @param  list<int>  $teacherProfileIds
     */
    public function findFirstConflictingWithTemplateSlot(
        int $roomId,
        DayOfWeek $dayOfWeek,
        string $startTime,
        string $endTime,
        string $startDate,
        ?string $endDate,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): ?ScheduleInstance {
        return $this->modelQuery()
            ->with('schoolClass:id,code,name')
            ->where(fn (Builder $builder): Builder => $this->whereRoomOrTeacherIsTaken(
                builder: $builder,
                roomId: $roomId,
                teacherProfileIds: $teacherProfileIds,
            ))
            ->where('schedule_instances.date', '>=', $startDate)
            ->when(
                $endDate !== null,
                fn (Builder $builder): Builder => $builder->where('schedule_instances.date', '<=', $endDate),
            )
            ->where('schedule_instances.start_time', '<', $endTime)
            ->where('schedule_instances.end_time', '>', $startTime)
            ->where('schedule_instances.status', '!=', ScheduleStatus::Cancelled)
            ->when(
                $excludeTemplateId !== null,
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $nested): Builder => $nested
                        ->whereNull('schedule_instances.template_id')
                        ->orWhere('schedule_instances.template_id', '!=', $excludeTemplateId),
                ),
            )
            ->whereRaw('extract(isodow from schedule_instances."date") = ?', [$dayOfWeek->toIsoWeekday()])
            ->orderBy('schedule_instances.date')
            ->orderBy('schedule_instances.start_time')
            ->orderBy('schedule_instances.id')
            ->first();
    }

    /**
     * Find the first written session already occupying one lesson's room or one of its
     * people, or null when that single slot is clear.
     *
     * One date, so the weekday arithmetic of the recurrence comparison does not arise and
     * `(room_id, date, start_time, end_time)` answers the room branch directly. Times are
     * compared half-open, so lessons that merely touch are not a clash.
     *
     * Cancelled sessions are left out for the same reason as everywhere else: a called-off
     * lesson occupies nothing.
     *
     * `$excludeInstanceId` leaves one session out, which every edit of a session needs so
     * it is not reported as clashing with itself.
     *
     * @param  list<int>  $teacherProfileIds
     */
    public function findFirstConflictingWithSession(
        int $roomId,
        string $date,
        string $startTime,
        string $endTime,
        array $teacherProfileIds,
        ?int $excludeInstanceId = null,
    ): ?ScheduleInstance {
        return $this->modelQuery()
            ->with('schoolClass:id,code,name')
            ->where(fn (Builder $builder): Builder => $this->whereRoomOrTeacherIsTaken(
                builder: $builder,
                roomId: $roomId,
                teacherProfileIds: $teacherProfileIds,
            ))
            ->where('schedule_instances.date', $date)
            ->where('schedule_instances.start_time', '<', $endTime)
            ->where('schedule_instances.end_time', '>', $startTime)
            ->where('schedule_instances.status', '!=', ScheduleStatus::Cancelled)
            ->when(
                $excludeInstanceId !== null,
                fn (Builder $builder): Builder => $builder->whereKeyNot($excludeInstanceId),
            )
            ->orderBy('schedule_instances.start_time')
            ->orderBy('schedule_instances.id')
            ->first();
    }

    /**
     * Persist a new written session.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): ScheduleInstance
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Write a session's teacher list and return the session with that list loaded.
     *
     * The rows are written for a session that has none yet — materialising one copies the
     * fixed schedule's list across — so nothing is removed first. The caller keeps this
     * inside the transaction that created the session: a session with no main teacher is
     * a state that must not exist even for a moment.
     *
     * @param  list<array{teacher_profile_id: int, role: ScheduleTeacherRole, replaces_profile_id?: int|null}>  $teachers
     */
    public function createTeachers(ScheduleInstance $instance, array $teachers): ScheduleInstance
    {
        $instance->teachers()->createMany($teachers);

        return $instance->load('teachers');
    }

    /**
     * Narrow a session query to the rows holding a given room or at least one of a given
     * set of people, which is the pair of reasons a slot can be taken.
     *
     * The teacher side is an EXISTS over `schedule_instance_teachers` that never reads
     * `role`: an assistant booked twice over is still one person in two rooms at once, so
     * the role cannot soften the rule. An empty list of people leaves the room as the only
     * way to clash, which is the honest reading of a candidate that names nobody.
     *
     * @param  Builder<ScheduleInstance>  $builder
     * @param  list<int>  $teacherProfileIds
     * @return Builder<ScheduleInstance>
     */
    private function whereRoomOrTeacherIsTaken(Builder $builder, int $roomId, array $teacherProfileIds): Builder
    {
        return $builder
            ->where('schedule_instances.room_id', $roomId)
            ->orWhereHas(
                'teachers',
                fn (Builder $teachers): Builder => $teachers->whereIn('teacher_profile_id', $teacherProfileIds),
            );
    }
}
