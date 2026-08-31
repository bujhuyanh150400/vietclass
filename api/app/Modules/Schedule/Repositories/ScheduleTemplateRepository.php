<?php

namespace App\Modules\Schedule\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleTemplate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
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
