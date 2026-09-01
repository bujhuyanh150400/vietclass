<?php

namespace App\Modules\Schedule\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleTemplate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class ScheduleTemplateRepository extends BaseRepository
{
    /** This repository is backed by the ScheduleTemplate model. */
    protected function modelClass(): ?string
    {
        return ScheduleTemplate::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return every fixed schedule of one class, newest weekday slot first, including
     * the ones already closed so the list reads as the class's schedule history.
     *
     * A teacher identifier narrows the result to the schedules that person is on,
     * whatever their role, which is how the read scope for teachers is applied.
     *
     * @return Collection<int, ScheduleTemplate>
     */
    public function listForClass(int $classId, ?int $teacherProfileId = null): Collection
    {
        return $this->withDetailRelations($this->modelQuery())
            ->where('class_id', $classId)
            ->when(
                $teacherProfileId !== null,
                fn (Builder $builder): Builder => $builder->whereHas(
                    'teachers',
                    fn (Builder $teachers): Builder => $teachers->where('teacher_profile_id', $teacherProfileId),
                ),
            )
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Return every fixed schedule whose validity window overlaps a date range, carrying
     * its class's own dates and its teacher list, so the projection can walk the range
     * without asking the database anything else.
     *
     * The class columns arrive as a join rather than as a relation because the projection
     * needs them on every candidate row, and `classes.start_at`/`end_at` are two of the
     * four bounds a projected session lives between. They are exposed as
     * `class_start_at` and `class_end_at`, raw `YYYY-MM-DD` strings, alongside
     * `class_subject_id`, which a projected session reports as its own subject because a
     * fixed schedule has none of its own.
     *
     * A projected session reports names as well as identifiers, and the ones that come
     * from the class ride the join already there rather than paying for a second read of
     * the same rows: `class_code` and `class_name`, plus `class_subject_name` from a join
     * onto the subject the class teaches. The code travels with the name because class
     * names repeat across grades and codes do not. Both joins are inner joins because
     * `schedule_templates.class_id` and `classes.subject_id` are required columns, so
     * neither can drop a candidate schedule.
     *
     * The room and the teachers' names are eager loads instead, each naming its columns,
     * since neither is one row per schedule. The room is loaded whatever state it is in: a
     * lesson in a room under maintenance is an ordinary thing to find on a calendar, and
     * naming it is exactly what a reader working from the filtered `rooms/options` list
     * could not do.
     *
     * A schedule is a candidate when its own window and its class's window both reach
     * into the range. A NULL `end_date` or `end_at` means "no upper bound yet", so it is
     * read as an open interval rather than as a missing value.
     *
     * Filtering by teacher keeps the schedules that person is on whatever their role, so
     * an assistant sees the sessions they assist at; filtering by class or room narrows
     * on the schedule's own columns.
     *
     * @return Collection<int, ScheduleTemplate>
     */
    public function listOverlappingRange(
        string $from,
        string $to,
        ?int $classId = null,
        ?int $teacherProfileId = null,
        ?int $roomId = null,
    ): Collection {
        return $this->modelQuery()
            ->join('classes', 'classes.id', '=', 'schedule_templates.class_id')
            ->join('subjects', 'subjects.id', '=', 'classes.subject_id')
            ->select([
                'schedule_templates.*',
                'classes.start_at as class_start_at',
                'classes.end_at as class_end_at',
                'classes.subject_id as class_subject_id',
                'classes.code as class_code',
                'classes.name as class_name',
                'subjects.name as class_subject_name',
            ])
            ->with([
                'room:id,name',
                'teachers.teacher.profile:id,full_name',
            ])
            ->where('schedule_templates.start_date', '<=', $to)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->whereNull('schedule_templates.end_date')
                    ->orWhere('schedule_templates.end_date', '>=', $from),
            )
            ->where('classes.start_at', '<=', $to)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->whereNull('classes.end_at')
                    ->orWhere('classes.end_at', '>=', $from),
            )
            ->when(
                $classId !== null,
                fn (Builder $builder): Builder => $builder->where('schedule_templates.class_id', $classId),
            )
            ->when(
                $roomId !== null,
                fn (Builder $builder): Builder => $builder->where('schedule_templates.room_id', $roomId),
            )
            ->when(
                $teacherProfileId !== null,
                fn (Builder $builder): Builder => $builder->whereHas(
                    'teachers',
                    fn (Builder $teachers): Builder => $teachers->where('teacher_profile_id', $teacherProfileId),
                ),
            )
            ->orderBy('schedule_templates.start_time')
            ->orderBy('schedule_templates.id')
            ->get();
    }

    /**
     * Find one fixed schedule with the relations a detail view reports.
     */
    public function findById(int $templateId): ?ScheduleTemplate
    {
        return $this->withDetailRelations($this->modelQuery())->find($templateId);
    }

    /**
     * Persist a new fixed schedule.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): ScheduleTemplate
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to an existing fixed schedule and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(ScheduleTemplate $template, array $attributes): ScheduleTemplate
    {
        $template->fill($attributes)->save();

        return $template;
    }

    /**
     * Remove a fixed schedule, and with it the teacher rows that cascade from it.
     */
    public function delete(ScheduleTemplate $template): void
    {
        $template->delete();
    }

    /**
     * Replace a schedule's whole teacher list with the given one and return the
     * schedule with the new list loaded.
     *
     * The old rows are removed and the new ones written inside a single transaction,
     * because the intermediate state — no main teacher, or two of them — is one the
     * partial unique index refuses and no reader should ever observe. Passing an
     * incomplete list therefore fails as a whole rather than leaving the schedule
     * half-staffed.
     *
     * @param  list<array{teacher_profile_id: int, role: ScheduleTeacherRole}>  $teachers
     */
    public function replaceTeachers(ScheduleTemplate $template, array $teachers): ScheduleTemplate
    {
        return DB::transaction(function () use ($template, $teachers): ScheduleTemplate {
            $template->teachers()->delete();
            $template->teachers()->createMany($teachers);

            return $template->load('teachers');
        });
    }

    /**
     * Return the teacher identifiers currently assigned to a fixed schedule, whatever
     * role each of them holds.
     *
     * @return list<int>
     */
    public function teacherProfileIds(ScheduleTemplate $template): array
    {
        return $template->teachers()
            ->pluck('teacher_profile_id')
            ->map(fn (mixed $id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * Find the first fixed schedule that would clash with the given weekly slot, or
     * null when the slot is free.
     *
     * One statement answers the whole rule: the same weekday, date ranges that
     * overlap, time ranges that overlap, and either the same room or at least one
     * shared teacher. A NULL `end_date` on either side means "runs until the class
     * ends", so it is read as an open interval rather than as a missing value, and
     * therefore overlaps every later date.
     *
     * Time ranges are compared half-open, so slots that merely touch — 08:00–09:30
     * and 09:30–11:00 — are not a clash.
     *
     * The teacher comparison is an EXISTS over `schedule_template_teachers` that never
     * reads `role`: an assistant double-booked is still one person in two rooms at
     * once, so the role cannot soften the rule. There is no `?? classes.teacher_id`
     * fallback because teachers are always stated explicitly.
     *
     * `$excludeTemplateId` leaves one schedule out of the comparison, which is what an
     * edit needs so a schedule does not clash with the version of itself being
     * replaced.
     *
     * @param  list<int>  $teacherProfileIds
     */
    public function findFirstConflicting(
        int $roomId,
        DayOfWeek $dayOfWeek,
        string $startTime,
        string $endTime,
        string $startDate,
        ?string $endDate,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): ?ScheduleTemplate {
        return $this->modelQuery()
            ->with('schoolClass:id,code,name')
            ->where('day_of_week', $dayOfWeek)
            ->when(
                $excludeTemplateId !== null,
                fn (Builder $builder): Builder => $builder->whereKeyNot($excludeTemplateId),
            )
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->whereNull('end_date')
                    ->orWhere('end_date', '>=', $startDate),
            )
            ->when(
                $endDate !== null,
                fn (Builder $builder): Builder => $builder->where('start_date', '<=', $endDate),
            )
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->where('room_id', $roomId)
                    ->orWhereHas(
                        'teachers',
                        fn (Builder $teachers): Builder => $teachers
                            ->whereIn('teacher_profile_id', $teacherProfileIds),
                    ),
            )
            ->orderBy('start_date')
            ->orderBy('id')
            ->first();
    }

    /**
     * Find the first fixed schedule that projects a session onto one date clashing with
     * the given lesson, or null when nothing is projected in the way.
     *
     * A projected session occupies a room and its people exactly as a written one does,
     * so a lesson cannot be written on top of one. The weekday is worked out from the date
     * in PHP and compared against the stored `day_of_week`, which is the direction that
     * keeps the comparison on a column an index can serve — the reverse direction, deriving
     * a weekday from each stored date, is what makes the recurrence-against-written-row
     * comparison expensive. The four bounds of the projection are
     * applied here — the schedule's own `start_date`/`end_date` and its class's
     * `start_at`/`end_at`, each NULL upper bound read as an open interval — so a schedule
     * that no longer reaches the date is not compared.
     *
     * The `NOT EXISTS` is what keeps this from contradicting the written-against-written
     * comparison: a `(template_id, date)` pair that already has a written row projects
     * nothing at all, because a written row always wins over a projected one. Without it
     * a session would be reported as clashing with the very projected session it replaced.
     * Status plays no part in that exclusion — a written row suppresses its projected twin
     * whatever state it is in, so a cancelled one leaves the slot empty rather than
     * handing it back to the projection.
     *
     * @param  list<int>  $teacherProfileIds
     */
    public function findFirstProjectingOnto(
        string $date,
        string $startTime,
        string $endTime,
        int $roomId,
        array $teacherProfileIds,
        ?int $excludeTemplateId = null,
    ): ?ScheduleTemplate {
        return $this->modelQuery()
            ->join('classes', 'classes.id', '=', 'schedule_templates.class_id')
            ->select('schedule_templates.*')
            ->with('schoolClass:id,code,name')
            ->where('schedule_templates.day_of_week', DayOfWeek::fromDate(Carbon::parse($date)))
            ->where('schedule_templates.start_date', '<=', $date)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->whereNull('schedule_templates.end_date')
                    ->orWhere('schedule_templates.end_date', '>=', $date),
            )
            ->where('classes.start_at', '<=', $date)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->whereNull('classes.end_at')
                    ->orWhere('classes.end_at', '>=', $date),
            )
            ->where('schedule_templates.start_time', '<', $endTime)
            ->where('schedule_templates.end_time', '>', $startTime)
            ->where(
                fn (Builder $builder): Builder => $builder
                    ->where('schedule_templates.room_id', $roomId)
                    ->orWhereHas(
                        'teachers',
                        fn (Builder $teachers): Builder => $teachers
                            ->whereIn('teacher_profile_id', $teacherProfileIds),
                    ),
            )
            ->when(
                $excludeTemplateId !== null,
                fn (Builder $builder): Builder => $builder->whereKeyNot($excludeTemplateId),
            )
            ->whereNotExists(
                fn (QueryBuilder $sessions): QueryBuilder => $sessions
                    ->select(DB::raw(1))
                    ->from('schedule_instances')
                    ->whereColumn('schedule_instances.template_id', 'schedule_templates.id')
                    ->where('schedule_instances.date', $date),
            )
            ->orderBy('schedule_templates.start_time')
            ->orderBy('schedule_templates.id')
            ->first();
    }

    /**
     * Attach the relations every fixed-schedule read reports.
     *
     * The teacher list is loaded three times over, once whole and once per role. The
     * split lists are what the API reports as `main_teacher` and `assistant_teachers`,
     * and loading them here rather than letting the resource filter the whole list keeps
     * the meaning of a role value in the model's relations alone. Three eager loads on a
     * handful of rows is the price; reading a role value in a second place is not.
     *
     * @param  Builder<ScheduleTemplate>  $query
     * @return Builder<ScheduleTemplate>
     */
    private function withDetailRelations(Builder $query): Builder
    {
        return $query->with([
            'room:id,name,capacity,status',
            'teachers.teacher.profile:id,full_name',
            'mainTeacher.teacher.profile:id,full_name',
            'assistantTeachers.teacher.profile:id,full_name',
        ]);
    }
}
