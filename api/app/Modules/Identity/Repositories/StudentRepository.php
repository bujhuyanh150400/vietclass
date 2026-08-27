<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class StudentRepository extends BaseRepository
{
    /** This repository is backed by the Student model. */
    protected function modelClass(): ?string
    {
        return Student::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of student profiles with the login account each one belongs to.
     *
     * @return LengthAwarePaginator<int, Student>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return $this->modelQuery()
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
        return $this->modelQuery()
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
        return $this->modelQuery()->create($attributes);
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
