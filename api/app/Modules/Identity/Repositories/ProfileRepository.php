<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Data\ListQuery;
use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\Profile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

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
        return $this->modelQuery()
            ->where('phone', $phone)
            ->where('full_name', $name)
            ->whereDoesntHave('studentProfile')
            ->orderBy('id')
            ->first();
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
        return $this->modelQuery()
            ->whereHas('guardianLinks')
            ->whereDoesntHave('studentProfile')
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
        return $this->modelQuery()
            ->whereDoesntHave('studentProfile')
            ->find($profileId);
    }
}
