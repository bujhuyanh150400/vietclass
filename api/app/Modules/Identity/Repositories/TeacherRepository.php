<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\TeacherProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class TeacherRepository extends BaseRepository
{
    /** This repository is backed by the TeacherProfile model. */
    protected function modelClass(): ?string
    {
        return TeacherProfile::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of teachers with the shared profile and login account each one
     * belongs to.
     *
     * @return LengthAwarePaginator<int, TeacherProfile>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        $builder = $this->modelQuery()
            ->with('profile.user:id,username,is_active')
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'profile',
                    fn (Builder $profile): Builder => $profile->where(
                        fn (Builder $scoped): Builder => $scoped
                            ->where('full_name', 'ilike', $query->searchLike())
                            ->orWhere('phone', 'ilike', $query->searchLike())
                            ->orWhere('email', 'ilike', $query->searchLike())
                            ->orWhereHas(
                                'user',
                                fn (Builder $user): Builder => $user->where('username', 'ilike', $query->searchLike()),
                            ),
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
                    'profile.user',
                    fn (Builder $user): Builder => $user->where('is_active', $query->filter('is_active')),
                ),
            );

        return $this->applySort($builder, $query)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the teachers a class may be assigned to: still employed, and holding a
     * login account that is not locked.
     *
     * @return Collection<int, TeacherProfile>
     */
    public function options(ListQuery $query): Collection
    {
        return $this->modelQuery()
            ->with('profile')
            ->where('status', TeacherStatus::Active)
            ->whereHas('profile.user', fn (Builder $user): Builder => $user->where('is_active', true))
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'profile',
                    fn (Builder $profile): Builder => $profile->where('full_name', 'ilike', $query->searchLike()),
                ),
            )
            ->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'teacher_profiles.profile_id'),
            )
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one teacher with the shared profile and login account behind it. The
     * identifier is the shared `profile_id`, which is also what `classes.teacher_id`
     * stores.
     */
    public function findById(int $teacherId): ?TeacherProfile
    {
        return $this->modelQuery()
            ->with('profile.user:id,username,is_active')
            ->find($teacherId);
    }

    /**
     * Persist the teaching role attached to an existing profile.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): TeacherProfile
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to the teaching role and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(TeacherProfile $teacher, array $attributes): TeacherProfile
    {
        $teacher->fill($attributes)->save();

        return $teacher;
    }

    /**
     * Apply the requested sort.
     *
     * `full_name` lives on the shared profile row. It is ordered through a correlated
     * subquery rather than a join, because the search clauses above already reference
     * `profiles` in their own subqueries and a second reference under the same name
     * would be ambiguous.
     *
     * @param  Builder<TeacherProfile>  $builder
     * @return Builder<TeacherProfile>
     */
    private function applySort(Builder $builder, ListQuery $query): Builder
    {
        if ($query->sort === 'full_name') {
            return $builder->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'teacher_profiles.profile_id'),
                $query->direction,
            );
        }

        return $builder->orderBy(
            $query->sort === 'id' ? 'profile_id' : $query->sort,
            $query->direction,
        );
    }
}
