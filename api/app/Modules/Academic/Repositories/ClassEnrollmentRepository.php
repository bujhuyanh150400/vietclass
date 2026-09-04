<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

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
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'student.profile',
                    fn (Builder $profile): Builder => $profile->where('full_name', 'ilike', $query->searchLike()),
                ),
            )
            ->orderBy($query->sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Return the students who may still be added to one class: their account is usable
     * and they do not already hold a running enrolment there.
     *
     * Students who left the class previously are included, because re-enrolling is
     * allowed and keeps the earlier period as history. The exclusion is expressed as a
     * subquery over enrolments rather than a relation on the student model, because
     * `StudentProfile` is owned by the Identity module and must not reference this
     * module's `ClassEnrollment` back.
     *
     * @return LengthAwarePaginator<int, StudentProfile>
     */
    public function paginateAvailableForClass(int $classId, ListQuery $query): LengthAwarePaginator
    {
        $activeStudentIds = $this->modelQuery()
            ->where('class_id', $classId)
            ->active()
            ->pluck('student_id');

        return StudentProfile::query()
            ->with(['profile.user:id,username,is_active', 'profile.avatarFileLink.file', 'primaryGuardian.guardian'])
            ->whereHas('profile.user', fn (Builder $user): Builder => $user->where('is_active', true))
            ->whereNotIn('profile_id', $activeStudentIds)
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $builder->whereHas(
                    'profile',
                    fn (Builder $profile): Builder => $profile->where(
                        fn (Builder $scoped): Builder => $scoped
                            ->where('full_name', 'ilike', $query->searchLike())
                            ->orWhere('phone', 'ilike', $query->searchLike()),
                    ),
                ),
            )
            ->orderBy(
                Profile::query()->select('full_name')->whereColumn('profiles.id', 'student_profiles.profile_id'),
            )
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /**
     * Find one enrolment with the class and student it links.
     */
    public function findById(int $enrollmentId): ?ClassEnrollment
    {
        return $this->modelQuery()
            ->with(['schoolClass', 'student.profile:id,full_name'])
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
