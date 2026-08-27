<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ClassRepository
{
    /**
     * Return one page of classes with the subject, teacher, and current headcount each
     * one needs to be understood without a second request.
     *
     * @return LengthAwarePaginator<int, SchoolClass>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return $this->withListRelations(SchoolClass::query())
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $scoped): Builder => $scoped
                        ->where('code', 'ilike', $query->searchLike())
                        ->orWhere('name', 'ilike', $query->searchLike()),
                ),
            )
            ->when(
                $query->hasFilter('status'),
                fn (Builder $builder): Builder => $builder->whereIn('status', (array) $query->filter('status')),
            )
            ->when(
                $query->hasFilter('subject_id'),
                fn (Builder $builder): Builder => $builder->whereIn('subject_id', (array) $query->filter('subject_id')),
            )
            ->when(
                $query->hasFilter('teacher_id'),
                fn (Builder $builder): Builder => $builder->whereIn('teacher_id', (array) $query->filter('teacher_id')),
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
        return SchoolClass::query()
            ->where('status', ClassStatus::Active)
            ->when($excludeId !== null, fn (Builder $builder): Builder => $builder->whereKeyNot($excludeId))
            ->when($subjectId !== null, fn (Builder $builder): Builder => $builder->where('subject_id', $subjectId))
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $scoped): Builder => $scoped
                        ->where('code', 'ilike', $query->searchLike())
                        ->orWhere('name', 'ilike', $query->searchLike()),
                ),
            )
            ->orderBy('code')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one class with the relations a detail view reports.
     */
    public function findById(int $classId): ?SchoolClass
    {
        return $this->withListRelations(SchoolClass::query())->find($classId);
    }

    /**
     * Persist a new class.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): SchoolClass
    {
        return SchoolClass::query()->create($attributes);
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
     * Close every running enrolment in a class as of the given date and report how many
     * were closed. Used when a class finishes.
     */
    public function endActiveEnrollments(int $classId, CarbonInterface $on): int
    {
        return ClassEnrollment::query()
            ->where('class_id', $classId)
            ->active($on)
            ->update(['left_at' => $on->toDateString()]);
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
            ->with(['subject:id,name', 'teacher:id,full_name'])
            ->withCount([
                'enrollments as active_students_count' => fn (Builder $builder): Builder => $builder->active(),
            ]);
    }
}
