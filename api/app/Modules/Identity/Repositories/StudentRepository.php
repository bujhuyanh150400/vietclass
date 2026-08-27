<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Modules\Identity\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class StudentRepository
{
    /**
     * Return one page of student profiles with the login account each one belongs to.
     *
     * @return LengthAwarePaginator<int, Student>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return Student::query()
            ->with('user:id,username,is_active')
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $scoped): Builder => $scoped
                        ->where('full_name', 'ilike', $query->searchLike())
                        ->orWhere('phone', 'ilike', $query->searchLike())
                        ->orWhere('parent_name', 'ilike', $query->searchLike())
                        ->orWhere('parent_phone', 'ilike', $query->searchLike())
                        ->orWhereHas(
                            'user',
                            fn (Builder $user): Builder => $user->where('username', 'ilike', $query->searchLike()),
                        ),
                ),
            )
            ->when(
                $query->hasFilter('status'),
                fn (Builder $builder): Builder => $builder->whereIn('status', (array) $query->filter('status')),
            )
            ->when(
                $query->hasFilter('grade_level'),
                fn (Builder $builder): Builder => $builder->whereIn('grade_level', (array) $query->filter('grade_level')),
            )
            ->when(
                $query->hasFilter('is_active'),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'user',
                    fn (Builder $user): Builder => $user->where('is_active', $query->filter('is_active')),
                ),
            )
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Find one student profile with its login account.
     */
    public function findById(int $studentId): ?Student
    {
        return Student::query()
            ->with('user:id,username,is_active')
            ->find($studentId);
    }

    /**
     * Persist a new student profile.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Student
    {
        return Student::query()->create($attributes);
    }

    /**
     * Apply changes to an existing student profile and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Student $student, array $attributes): Student
    {
        $student->fill($attributes)->save();

        return $student;
    }
}
