<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class StudentRepository extends BaseRepository
{
    /** This repository is backed by the StudentProfile model. */
    protected function modelClass(): ?string
    {
        return StudentProfile::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of students with the shared profile, login account, every
     * guardian, and the classes each one still attends.
     *
     * Guardians and enrolments are eager-loaded rather than read per row: the list
     * serves up to two hundred students per page, so resolving them lazily would put
     * two queries behind every row.
     *
     * @return LengthAwarePaginator<int, StudentProfile>
     */
    public function paginateList(ListQuery $query): LengthAwarePaginator
    {
        $builder = $this->modelQuery()
            ->with([
                'profile.user:id,username,is_active',
                'profile.avatarFileLink.file',
                'primaryGuardian.guardian',
                'guardianLinks.guardian',
                'activeEnrollments.schoolClass.subject',
            ])
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(
                    fn (Builder $scoped): Builder => $scoped
                        ->whereHas(
                            'profile',
                            fn (Builder $profile): Builder => $profile->where(
                                fn (Builder $inner): Builder => $inner
                                    ->where('full_name', 'ilike', $query->searchLike())
                                    ->orWhere('phone', 'ilike', $query->searchLike())
                                    ->orWhereHas(
                                        'user',
                                        fn (Builder $user): Builder => $user->where('username', 'ilike', $query->searchLike()),
                                    ),
                            ),
                        )
                        ->orWhereHas(
                            'guardianLinks.guardian',
                            fn (Builder $guardian): Builder => $guardian
                                ->where('full_name', 'ilike', $query->searchLike())
                                ->orWhere('phone', 'ilike', $query->searchLike()),
                        )
                        ->when(
                            $this->searchAsProfileId($query) !== null,
                            fn (Builder $scopedById): Builder => $scopedById->orWhere(
                                'student_profiles.profile_id',
                                $this->searchAsProfileId($query),
                            ),
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
                    'profile.user',
                    fn (Builder $user): Builder => $user->where('is_active', $query->filter('is_active')),
                ),
            );

        return $this->applySort($builder, $query)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Read the search term as a student id, or return null when it cannot be one.
     *
     * The list prints the profile id as the student's code, so someone reading a row
     * out loud and typing it back expects to land on that student. The match is added
     * alongside the text clauses rather than replacing them, because phone numbers are
     * digits too and searching one must keep working.
     *
     * Only a clean, in-range positive integer qualifies. A term longer than PHP's
     * integer range would overflow on cast and silently become an unrelated id, which
     * is worse than not matching at all.
     */
    private function searchAsProfileId(ListQuery $query): ?int
    {
        $search = trim((string) $query->search);

        if ($search === '' || ! ctype_digit($search) || strlen($search) > 18) {
            return null;
        }

        $id = (int) $search;

        return $id > 0 ? $id : null;
    }

    /**
     * Find one student with the shared profile, login account, every guardian, and the
     * classes they still attend. The identifier is the shared `profile_id`, which is
     * also what `class_enrollments.student_id` stores.
     *
     * The eager-load set matches `paginateList` on purpose: every write action returns
     * the student through here, so a single record and a listed row report the same
     * fields.
     */
    public function findById(int $studentId): ?StudentProfile
    {
        return $this->modelQuery()
            ->with([
                'profile.user:id,username,is_active',
                'profile.avatarFileLink.file',
                'primaryGuardian.guardian',
                'guardianLinks.guardian',
                'activeEnrollments.schoolClass.subject',
            ])
            ->find($studentId);
    }

    /**
     * Persist the student role attached to an existing profile.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): StudentProfile
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to the student role and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(StudentProfile $student, array $attributes): StudentProfile
    {
        $student->fill($attributes)->save();

        return $student;
    }

    /**
     * Apply the requested sort. `full_name` lives on the shared profile row and is
     * ordered through a correlated subquery, for the same reason as on teachers.
     *
     * @param  Builder<StudentProfile>  $builder
     * @return Builder<StudentProfile>
     */
    private function applySort(Builder $builder, ListQuery $query): Builder
    {
        if ($query->sort === 'full_name') {
            return $builder->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'student_profiles.profile_id'),
                $query->direction,
            );
        }

        return $builder->orderBy(
            $query->sort === 'id' ? 'profile_id' : $query->sort,
            $query->direction,
        );
    }
}
