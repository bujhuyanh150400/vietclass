<?php

namespace App\Modules\Academic\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Academic\Models\Profile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class ProfileRepository extends BaseRepository
{
    /** This repository is backed by the Profile model. */
    protected function modelClass(): ?string
    {
        return Profile::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Persist a new profile.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Profile
    {
        return $this->modelQuery()->create($attributes);
    }

    /**
     * Apply changes to an existing profile and return the refreshed record.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function update(Profile $profile, array $attributes): Profile
    {
        $profile->fill($attributes)->save();

        return $profile;
    }

    /** Lock one profile before atomically replacing its avatar configuration and link. */
    public function findForUpdate(int $profileId): ?Profile
    {
        return $this->modelQuery()->lockForUpdate()->find($profileId);
    }

    /** Return only role-pure profiles that currently have at least one guardian link. */
    private function guardianQuery(): Builder
    {
        return $this->modelQuery()
            ->whereNull('user_id')
            ->whereDoesntHave('teacherProfile')
            ->whereDoesntHave('studentProfile')
            ->whereHas('guardianLinks');
    }

    /** Return a locked guardian record with its complete student roster. */
    public function findGuardian(int $profileId, bool $lock = false): ?Profile
    {
        $query = $this->guardianQuery()->with('guardianLinks.studentProfile.profile');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->find($profileId);
    }

    /** Return one eager-loaded page of guardian records in stable order. */
    public function paginateGuardians(ListQuery $query): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $builder = $this->guardianQuery()->with('guardianLinks.studentProfile.profile');

        if ($query->hasSearch()) {
            $this->whereAnyUnaccentedLike($builder, ['full_name', 'phone'], (string) $query->searchLike());
        }

        $sort = match ($query->sort) {
            'full_name', 'created_at', 'id' => $query->sort,
            default => 'id',
        };

        return $builder
            ->orderBy($sort, $query->direction)
            ->paginate(perPage: $query->perPage, page: $query->page);
    }

    /** Return an exact duplicate among eligible guardian profiles. */
    public function findGuardianDuplicate(string $phone, string $name, ?int $exceptId = null): ?Profile
    {
        // Serialize exact duplicate checks for the same identity because the existing
        // schema intentionally has no unique constraint for guardian contact fields.
        if (DB::connection()->getDriverName() === 'pgsql') {
            $lockKey = unpack('q', substr(hash('sha256', $name."\\0".$phone, true), 0, 8))[1];
            DB::select('select pg_advisory_xact_lock(?)', [$lockKey]);
        }

        return $this->guardianQuery()
            ->lockForUpdate()
            ->when($exceptId !== null, fn (Builder $query): Builder => $query->where('id', '<>', $exceptId))
            ->where('phone', $phone)
            ->where('full_name', $name)
            ->orderBy('id')
            ->first();
    }

    /**
     * Find the oldest existing profile that may be reused as a guardian: one that
     * already carries the exact same phone number and full name, and does not itself
     * hold a student role.
     *
     * Both the phone and the name must match, compared exactly with no trimming or
     * case folding. Matching on phone alone let a mistyped phone number transplant
     * whichever unrelated profile already held that number — discarding the submitted
     * guardian name and gender and silently attaching a stranger. Requiring the name
     * too still lets a guardian entered twice from two siblings' forms resolve to one
     * profile, since both submissions carry the identical name.
     *
     * A profile carrying a student role is never returned, even when phone and name
     * happen to match: a student must never become another student's guardian. A
     * profile carrying a teacher role (or no role at all) remains a valid match, so a
     * teacher using their own number as their child's guardian contact keeps working.
     *
     * The column is deliberately not unique, so this returns the first match rather
     * than the only one.
     */
    public function findGuardianByPhoneAndName(string $phone, string $name): ?Profile
    {
        return $this->findGuardianDuplicate(phone: $phone, name: $name);
    }

    /**
     * Return the guardians already on file that match a typed name or phone number,
     * for the picker that links a new student to an existing guardian.
     *
     * Only profiles that already act as somebody's guardian are offered. Listing every
     * profile without a student role would put the whole teacher directory in a
     * guardian picker, which is not what a caller searching for "the parent I entered
     * for the older sibling" is looking for. A profile carrying a student role is
     * excluded for the same reason it is excluded from `findGuardianByPhoneAndName`.
     *
     * The name match ignores tone marks, so "Hung" finds "Nguyễn Văn Hùng". That is
     * deliberately looser than `findGuardianByPhoneAndName`, which stays exact: this
     * one offers candidates for a person to pick from, while that one decides on its
     * own whether two records are the same human being.
     *
     * @return Collection<int, Profile>
     */
    public function guardianOptions(ListQuery $query): Collection
    {
        return $this->guardianQuery()
            ->when(
                $query->hasSearch(),
                fn (Builder $builder): Builder => $this->whereAnyUnaccentedLike(
                    $builder,
                    ['full_name', 'phone'],
                    (string) $query->searchLike(),
                ),
            )
            ->orderBy('full_name')
            ->limit($query->perPage)
            ->get();
    }

    /**
     * Find the profile a caller named as an existing guardian, or nothing when it may
     * not act as one.
     *
     * Eligibility is the same rule the phone-and-name match applies: any profile that
     * does not itself hold a student role. It is deliberately wider than
     * `guardianOptions`, because a caller may legitimately name a profile that is not
     * a guardian yet — linking it is exactly what makes it one.
     */
    public function findGuardianCandidate(int $profileId): ?Profile
    {
        return $this->guardianQuery()->find($profileId);
    }
}
