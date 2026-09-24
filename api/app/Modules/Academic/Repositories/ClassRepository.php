<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ClassRepository extends BaseRepository
{
    /** This repository is backed by the SchoolClass model. */
    protected function modelClass(): ?string
    {
        return SchoolClass::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of classes with their full subject set, teaching team, and current
     * headcount so each row is understood without another request.
     *
     * @return LengthAwarePaginator<int, SchoolClass>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return $this->withListRelations($this->modelQuery())
            ->when(
                $query->hasSearch(),
                function (Builder $classes) use ($query): Builder {
                    return $classes->where(function (Builder $matches) use ($query): void {
                        $this->whereAnyUnaccentedLike(
                            $matches,
                            ['code', 'name'],
                            (string) $query->searchLike(),
                        );
                        if (ctype_digit((string) $query->search)) {
                            $matches->orWhere('classes.id', (int) $query->search);
                        }
                    });
                },
            )
            ->when(
                $query->hasFilter('status'),
                fn (Builder $builder): Builder => $builder->whereIn('status', (array) $query->filter('status')),
            )
            ->when(
                $query->hasFilter('subject_id'),
                fn (Builder $builder): Builder => $builder->whereHas('subjects',
                    fn (Builder $subjects): Builder => $subjects->whereIn('subjects.id', (array) $query->filter('subject_id')),
                ),
            )
            ->when(
                $query->hasFilter('teacher_id'),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'primaryTeacher',
                    fn (Builder $teachers): Builder => $teachers->whereIn('teacher_profiles.profile_id', (array) $query->filter('teacher_id')),
                ),
            )
            ->when(
                $query->hasFilter('grade_level'),
                fn (Builder $builder): Builder => $builder->whereIn('grade_level', (array) $query->filter('grade_level')),
            )
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the classes a student may be moved into: still running, and optionally
     * excluding the class being left and restricted to one subject.
     *
     * @return Collection<int, SchoolClass>
     */
    public function options(ListQuery $query, ?int $excludeId = null, ?int $subjectId = null): Collection
    {
        return $this->modelQuery()
            ->where('status', ClassStatus::Active)
            ->when($excludeId !== null, fn (Builder $builder): Builder => $builder->whereKeyNot($excludeId))
            ->when($subjectId !== null, fn (Builder $builder): Builder => $builder->whereHas(
                'subjects',
                fn (Builder $subjects): Builder => $subjects->where('subjects.id', $subjectId),
            ))
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $this->whereAnyUnaccentedLike(
                    $builder,
                    ['code', 'name'],
                    (string) $query->searchLike(),
                ),
            )
            ->orderBy('code')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Search possible transfer destinations; the action annotates each row with the
     * current rules while the transfer action rechecks them under locks on submit.
     *
     * @return LengthAwarePaginator<int, SchoolClass>
     */
    public function paginateTransferCandidates(int $sourceClassId, ListQuery $query): LengthAwarePaginator
    {
        return $this->withListRelations($this->modelQuery()->whereKeyNot($sourceClassId))
            ->when(
                $query->hasSearch(),
                fn (Builder $classes): Builder => $this->whereAnyUnaccentedLike(
                    $classes,
                    ['code', 'name'],
                    (string) $query->searchLike(),
                ),
            )
            ->orderBy($query->sort === 'id' ? 'classes.id' : 'classes.'.$query->sort, $query->direction)
            ->orderBy('classes.id', $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Read current teacher assignment IDs before taking teacher locks for a class edit.
     *
     * @return list<int>
     */
    public function teacherIdsForClass(int $classId): array
    {
        $class = $this->modelQuery()->with('teachers:profile_id')->find($classId);

        return $class?->teachers->pluck('profile_id')->map(static fn ($id): int => (int) $id)->all() ?? [];
    }

    /**
     * Report whether a currently enrolled student would mismatch a proposed class grade.
     */
    public function hasActiveEnrollmentWithDifferentGrade(int $classId, int $gradeLevel): bool
    {
        return ClassEnrollment::query()
            ->where('class_id', $classId)
            ->active()
            ->whereHas('student', fn (Builder $students): Builder => $students->where('grade_level', '<>', $gradeLevel))
            ->exists();
    }

    /**
     * Find and lock a class before changing its relationships or capacity.
     */
    public function findByIdForUpdate(int $classId): ?SchoolClass
    {
        return $this->modelQuery()->lockForUpdate()->find($classId);
    }

    /**
     * Lock a stable set of classes in ascending ID order for cross-class mutations.
     *
     * @param  list<int>  $classIds
     * @return Collection<int, SchoolClass>
     */
    public function lockByIds(array $classIds): Collection
    {
        return $this->modelQuery()
            ->whereIn('id', array_values(array_unique($classIds)))
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * Lock active classes assigned to a teacher in ascending class-ID order, then reload assistant roles.
     *
     * @return Collection<int, SchoolClass>
     */
    public function lockActiveAssignmentsForTeacher(int $teacherId): Collection
    {
        return $this->modelQuery()
            ->where('status', ClassStatus::Active)
            ->whereHas(
                'teachers',
                fn (Builder $teachers): Builder => $teachers->where('teacher_profiles.profile_id', $teacherId),
            )
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->load(['primaryTeacher:profile_id', 'assistantTeachers:profile_id']);
    }

    /**
     * Find one class with the relations a detail view reports.
     */
    public function findById(int $classId): ?SchoolClass
    {
        return $this->withListRelations($this->modelQuery())->find($classId);
    }

    /**
     * Persist a new class.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): SchoolClass
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to an existing class and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(SchoolClass $class, array $attributes): SchoolClass
    {
        $class->fill($attributes)->save();

        return $class;
    }

    /**
     * Count the students currently holding a place in this class, which is the figure
     * capacity is measured against.
     */
    public function countActiveEnrollments(int $classId, ?CarbonInterface $on = null): int
    {
        return ClassEnrollment::query()
            ->where('class_id', $classId)
            ->active($on)
            ->count();
    }

    /**
     * Attach the relations and counts every class listing reports.
     *
     * @param  Builder<SchoolClass>  $query
     * @return Builder<SchoolClass>
     */
    private function withListRelations(Builder $query): Builder
    {
        return $query
            ->with([
                'primarySubject:id,name,is_active',
                'subjects' => fn ($subjects) => $subjects
                    ->select('subjects.id', 'subjects.name', 'subjects.is_active', 'subjects.grade_levels')
                    ->orderBy('subjects.id'),
                'primaryTeacher.profile:id,full_name',
                'assistantTeachers.profile:id,full_name',
            ])
            ->withCount([
                'enrollments as active_students_count' => fn (Builder $builder): Builder => $builder->active(),
                'enrollments as past_enrollments_count' => fn (Builder $builder): Builder => $builder
                    ->whereNotNull('left_at')
                    ->where('left_at', '<=', now()->toDateString()),
            ]);
    }
}
