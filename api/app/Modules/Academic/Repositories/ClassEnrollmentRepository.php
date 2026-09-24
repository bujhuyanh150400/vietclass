<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\StudentProfile;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ClassEnrollmentRepository extends BaseRepository
{
    /** This repository is backed by the ClassEnrollment model. */
    protected function modelClass(): ?string
    {
        return ClassEnrollment::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Return one page of a class roster, newest membership first, including periods a
     * student has already left so the history stays visible.
     *
     * @return LengthAwarePaginator<int, ClassEnrollment>
     */
    public function paginateForClass(int $classId, ListQuery $query): LengthAwarePaginator
    {
        return $this->modelQuery()
            ->with(['student:profile_id,grade_level', 'student.profile:id,full_name,phone'])
            ->where('class_id', $classId)
            ->when(
                $query->hasFilter('active_only') && (bool) $query->filter('active_only'),
                fn (Builder $builder): Builder => $builder->active(),
            )
            ->when(
                $query->hasFilter('left_only') && (bool) $query->filter('left_only'),
                fn (Builder $builder): Builder => $builder
                    ->whereNotNull('left_at')
                    ->where('left_at', '<=', now()->toDateString()),
            )
            ->when(
                $query->hasFilter('has_note') && (bool) $query->filter('has_note'),
                fn (Builder $builder): Builder => $builder->whereNotNull('note')->where('note', '<>', ''),
            )
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->where(function (Builder $matches) use ($query): void {
                    $pattern = (string) $query->searchLike();
                    $matches->whereHas(
                        'student.profile',
                        fn (Builder $profile): Builder => $this->whereAnyUnaccentedLike($profile, ['full_name'], $pattern),
                    )->orWhereRaw('student_id::text ILIKE ?', [$pattern]);
                }),
            )
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return every searchable student with account and running class details for the
     * enrollment picker; the action annotates each row with current eligibility.
     *
     * Students who left the class previously are included, because re-enrolling is
     * allowed and keeps the earlier period as history. The exclusion stays a subquery
     * over enrolments rather than a relation on the student model: it is scoped to one
     * class, which no relation on `StudentProfile` would express.
     *
     * `StudentProfile::activeEnrollments()` shares this module's active-enrolment
     * definition so the student list and class roster cannot drift apart.
     *
     * @return LengthAwarePaginator<int, StudentProfile>
     */
    public function paginateEnrollmentStudentOptions(ListQuery $query): LengthAwarePaginator
    {
        $pattern = (string) $query->searchLike();
        $sortColumn = match ($query->sort) {
            'full_name' => 'profiles.full_name',
            'grade_level' => 'student_profiles.grade_level',
            default => 'student_profiles.profile_id',
        };

        return StudentProfile::query()
            ->join('profiles', 'profiles.id', '=', 'student_profiles.profile_id')
            ->select('student_profiles.*')
            ->with([
                'profile:id,user_id,full_name,phone',
                'profile.user:id,is_active',
                'activeEnrollments.schoolClass:id,code,name',
                'activeEnrollments.schoolClass.subjects:id,name',
            ])
            ->when(
                $query->hasSearch(),
                fn (Builder $students): Builder => $students->where(function (Builder $matches) use ($pattern): void {
                    $this->whereAnyUnaccentedLike($matches, ['profiles.full_name', 'profiles.phone'], $pattern);
                    $matches->orWhereRaw('student_profiles.profile_id::text ILIKE ?', [$pattern]);
                }),
            )
            ->orderBy($sortColumn, $query->direction)
            ->orderBy('student_profiles.profile_id', $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return students with a usable account and matching grade who do not already hold
     * a running enrolment in the class.
     *
     * Students who left the class previously are included, because re-enrolling is
     * allowed and keeps the earlier period as history. The exclusion stays a subquery
     * over enrolments rather than a relation on the student model: it is scoped to one
     * class, which no relation on `StudentProfile` would express.
     *
     * `StudentProfile::activeEnrollments()` shares this module's active-enrolment
     * definition so the student list and class roster cannot drift apart.
     *
     * @return LengthAwarePaginator<int, StudentProfile>
     */
    public function paginateAvailableForClass(SchoolClass $class, ListQuery $query): LengthAwarePaginator
    {
        $activeStudentIds = $this->modelQuery()
            ->where('class_id', $class->id)
            ->active()
            ->pluck('student_id');

        return StudentProfile::query()
            // Guardians and running enrolments are loaded here because this page is
            // rendered by `StudentResource`, which reports both for every student it
            // serialises. Leaving them out would not shrink the payload — it would
            // resolve them one row at a time instead.
            ->with([
                'profile.user:id,username,is_active',
                'profile.avatarFileLink.file',
                'primaryGuardian.guardian',
                'guardianLinks.guardian',
                'activeEnrollments.schoolClass.primarySubject',
            ])
            ->whereHas('profile.user', fn (Builder $user): Builder => $user->where('is_active', true))
            ->where('grade_level', $class->grade_level->value)
            ->whereNotIn('profile_id', $activeStudentIds)
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'profile',
                    fn (Builder $profile): Builder => $this->whereAnyUnaccentedLike($profile, ['full_name', 'phone'], (string) $query->searchLike()),
                ),
            )
            ->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'student_profiles.profile_id'),
            )
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return distinct active and historical classes a student has held, with period counts.
     *
     * @return LengthAwarePaginator<int, SchoolClass>
     */
    public function paginateClassesForStudent(int $studentId, ListQuery $query): LengthAwarePaginator
    {
        $periodCount = $this->modelQuery()
            ->selectRaw('COUNT(*)')
            ->whereColumn('class_id', 'classes.id')
            ->where('student_id', $studentId);
        $isCurrent = $this->modelQuery()
            ->selectRaw('CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END')
            ->whereColumn('class_id', 'classes.id')
            ->where('student_id', $studentId)
            ->active();

        return SchoolClass::query()
            ->select('classes.*')
            ->selectSub($periodCount, 'enrollment_periods_count')
            ->selectSub($isCurrent, 'is_current')
            ->with([
                'subjects' => fn ($subjects) => $subjects
                    ->select('subjects.id', 'subjects.name')
                    ->orderBy('subjects.id'),
            ])
            ->whereIn(
                'classes.id',
                $this->modelQuery()->select('class_id')->where('student_id', $studentId)->distinct(),
            )
            ->when(
                $query->hasSearch(),
                fn (Builder $classes): Builder => $this->whereAnyUnaccentedLike(
                    $classes,
                    ['code', 'name'],
                    (string) $query->searchLike(),
                ),
            )
            ->orderByDesc('is_current')
            ->orderBy(
                $query->sort === 'id' ? 'classes.id' : 'classes.'.$query->sort,
                $query->direction,
            )
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the requested target classes the student currently attends.
     *
     * @param  list<int>  $classIds
     * @return list<int>
     */
    public function activeClassIdsForStudent(int $studentId, array $classIds): array
    {
        if ($classIds === []) {
            return [];
        }

        return $this->modelQuery()
            ->where('student_id', $studentId)
            ->whereIn('class_id', $classIds)
            ->active()
            ->distinct()
            ->orderBy('class_id')
            ->pluck('class_id')
            ->map(static fn ($classId): int => (int) $classId)
            ->all();
    }

    /**
     * Lock one enrolment row after its source and target class rows are locked.
     */
    public function findByIdForUpdate(int $enrollmentId): ?ClassEnrollment
    {
        return $this->modelQuery()->lockForUpdate()->find($enrollmentId);
    }

    /**
     * Lock active periods for a class in ascending enrollment-ID order before closing them.
     *
     * @return Collection<int, ClassEnrollment>
     */
    public function lockActiveForClass(int $classId, CarbonInterface $on): Collection
    {
        return $this->modelQuery()
            ->where('class_id', $classId)
            ->active($on)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * Find one enrolment with the class and student it links.
     */
    public function findById(int $enrollmentId): ?ClassEnrollment
    {
        return $this->modelQuery()
            ->with([
                'schoolClass',
                'student.profile:id,user_id,full_name',
                'student.profile.user:id,is_active',
            ])
            ->find($enrollmentId);
    }

    /**
     * Find the running enrolment a student holds in one class, if any. This is the
     * check that blocks a duplicate and allows a re-enrolment after leaving.
     */
    public function findActive(int $classId, int $studentId): ?ClassEnrollment
    {
        return $this->modelQuery()
            ->where('class_id', $classId)
            ->where('student_id', $studentId)
            ->active()
            ->first();
    }

    /**
     * Report whether a student holds more than one running enrolment in a class, used
     * before reopening a closed period.
     */
    public function hasOtherActive(int $classId, int $studentId, int $exceptEnrollmentId): bool
    {
        return $this->modelQuery()
            ->where('class_id', $classId)
            ->where('student_id', $studentId)
            ->whereKeyNot($exceptEnrollmentId)
            ->active()
            ->exists();
    }

    /**
     * Persist a new enrolment.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): ClassEnrollment
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to an existing enrolment and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(ClassEnrollment $enrollment, array $attributes): ClassEnrollment
    {
        $enrollment->fill($attributes)->save();

        return $enrollment;
    }
}
