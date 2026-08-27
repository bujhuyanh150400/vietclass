<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Modules\Identity\Enums\EmployeeStatus;
use App\Modules\Identity\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class TeacherRepository
{
    /**
     * Return one page of teacher profiles with the login account each one belongs to.
     *
     * @return LengthAwarePaginator<int, Teacher>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        return Teacher::query()
            ->with('user:id,username,is_active')
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $scoped): Builder => $scoped
                        ->where('full_name', 'ilike', $query->searchLike())
                        ->orWhere('phone', 'ilike', $query->searchLike())
                        ->orWhere('email', 'ilike', $query->searchLike())
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
     * Return the teachers a class may be assigned to: still employed, and holding a
     * login account that is not locked.
     *
     * @return Collection<int, Teacher>
     */
    public function options(ListQuery $query): Collection
    {
        return Teacher::query()
            ->where('status', EmployeeStatus::Active)
            ->whereHas('user', fn (Builder $user): Builder => $user->where('is_active', true))
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where('full_name', 'ilike', $query->searchLike()),
            )
            ->orderBy('full_name')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one teacher profile with its login account.
     */
    public function findById(int $teacherId): ?Teacher
    {
        return Teacher::query()
            ->with('user:id,username,is_active')
            ->find($teacherId);
    }

    /**
     * Persist a new teacher profile.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Teacher
    {
        return Teacher::query()->create($attributes);
    }

    /**
     * Apply changes to an existing teacher profile and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Teacher $teacher, array $attributes): Teacher
    {
        $teacher->fill($attributes)->save();

        return $teacher;
    }
}
