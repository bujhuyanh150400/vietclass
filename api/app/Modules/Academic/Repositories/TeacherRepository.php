<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\TeacherStatus;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\TeacherProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        $builder = $this->withListRelations($this->modelQuery())
            ->when(
                $query->hasSearch(),
                function (Builder $builder) use ($query): Builder {
                    $like = (string) $query->searchLike();

                    return $builder->where(function (Builder $scoped) use ($like): void {
                        $scoped->whereHas(
                            'profile',
                            function (Builder $profile) use ($like): void {
                                $profile->where(function (Builder $profileSearch) use ($like): void {
                                    $this->whereAnyUnaccentedLike(
                                        $profileSearch,
                                        ['full_name', 'phone', 'email'],
                                        $like,
                                    );
                                    $profileSearch->orWhereHas(
                                        'user',
                                        fn (Builder $user): Builder => $this->whereAnyUnaccentedLike(
                                            $user,
                                            ['username'],
                                            $like,
                                        ),
                                    );
                                });
                            },
                        )->orWhereHas(
                            'classes',
                            function (Builder $classes) use ($like): void {
                                $classes->where('status', ClassStatus::Active)
                                    ->where(function (Builder $classSearch) use ($like): void {
                                        $this->whereAnyUnaccentedLike($classSearch, ['code', 'name'], $like);
                                        $classSearch->orWhereHas(
                                            'subjects',
                                            fn (Builder $subjects): Builder => $this->whereAnyUnaccentedLike(
                                                $subjects,
                                                ['name'],
                                                $like,
                                            ),
                                        );
                                    });
                            },
                        );
                    });
                },
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
            )
            ->when(
                $query->hasFilter('subject_id'),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'classes',
                    fn (Builder $classes): Builder => $classes
                        ->where('status', ClassStatus::Active)
                        ->whereHas(
                            'subjects',
                            fn (Builder $subjects): Builder => $subjects->whereIn('subjects.id', (array) $query->filter('subject_id')),
                        ),
                ),
            )
            ->when(
                $query->hasFilter('class_id'),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'classes',
                    fn (Builder $classes): Builder => $classes
                        ->where('status', ClassStatus::Active)
                        ->whereIn('classes.id', (array) $query->filter('class_id')),
                ),
            )
            ->when(
                $query->hasFilter('joined_from'),
                fn (Builder $builder): Builder => $builder->whereDate('joined_at', '>=', $query->filter('joined_from')),
            )
            ->when(
                $query->hasFilter('joined_to'),
                fn (Builder $builder): Builder => $builder->whereDate('joined_at', '<=', $query->filter('joined_to')),
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
                function (Builder $teachers) use ($query): Builder {
                    return $teachers->where(function (Builder $matches) use ($query): void {
                        $matches->whereHas(
                            'profile',
                            fn (Builder $profile): Builder => $this->whereAnyUnaccentedLike(
                                $profile,
                                ['full_name'],
                                (string) $query->searchLike(),
                            ),
                        );
                        if (ctype_digit((string) $query->search)) {
                            $matches->orWhere('teacher_profiles.profile_id', (int) $query->search);
                        }
                    });
                },
            )
            ->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'teacher_profiles.profile_id'),
            )
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find one teacher with the shared profile and login account behind it. The
     * identifier is the shared `profile_id`, which is also what `class_teachers.teacher_id`
     * stores.
     */
    public function findById(int $teacherId): ?TeacherProfile
    {
        return $this->withListRelations($this->modelQuery())->find($teacherId);
    }

    /** Load historical teaching roles only for the teacher detail response. */
    public function findByIdWithEndedAssignments(int $teacherId): ?TeacherProfile
    {
        $teacher = $this->findById($teacherId);
        $teacher?->load([
            'endedClasses' => fn (BelongsToMany $classes): BelongsToMany => $classes
                ->select(['classes.id', 'classes.code', 'classes.name', 'classes.status'])
                ->with('primarySubject:id,name')
                ->orderBy('classes.code'),
            'endedAssistantClasses' => fn (BelongsToMany $classes): BelongsToMany => $classes
                ->select(['classes.id', 'classes.code', 'classes.name', 'classes.status'])
                ->with('primarySubject:id,name')
                ->orderBy('classes.code'),
        ]);

        return $teacher;
    }

    /**
     * Lock a stable, ordered set of teacher profiles while checking employment status.
     *
     * @param  list<int>  $teacherIds
     * @return Collection<int, TeacherProfile>
     */
    public function lockByIds(array $teacherIds): Collection
    {
        return $this->modelQuery()
            ->with('profile')
            ->whereIn('profile_id', $teacherIds)
            ->orderBy('profile_id')
            ->lockForUpdate()
            ->get();
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
     * Attach current lead and assistant assignments for every teacher list and detail row.
     *
     * @param  Builder<TeacherProfile>  $query
     * @return Builder<TeacherProfile>
     */
    private function withListRelations(Builder $query): Builder
    {
        return $query->with([
            'profile.user:id,username,is_active',
            'profile.avatarFileLink.file',
            'classes' => fn (BelongsToMany $classes): BelongsToMany => $classes
                ->select(['classes.id', 'classes.code', 'classes.name', 'classes.grade_level', 'classes.status'])
                ->where('status', ClassStatus::Active)
                ->with(['primarySubject:id,name', 'subjects:id,name'])
                ->orderBy('code'),
            'assistantClasses' => fn (BelongsToMany $classes): BelongsToMany => $classes
                ->select(['classes.id', 'classes.code', 'classes.name', 'classes.grade_level', 'classes.status'])
                ->with(['primarySubject:id,name', 'subjects:id,name'])
                ->orderBy('classes.code'),
        ]);
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
