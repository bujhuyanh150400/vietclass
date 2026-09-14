<?php

namespace App\Modules\Identity\Services;

use App\Core\Exceptions\ActionError;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Enums\IdentityError;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Repositories\ProfileRepository;
use App\Modules\Identity\Repositories\StudentGuardianRepository;

/**
 * Writes the set of people linked to one student.
 *
 * A student may be linked to several people and exactly one of them is the main
 * contact, so the payload carries the whole list and this reads it as the whole list:
 * whoever is not in it is unlinked. That is what lets one screen express adding,
 * removing, moving the main contact, and correcting a relationship without four
 * separate endpoints — and it is why a caller must send the roster it means rather
 * than a delta.
 *
 * Creating and editing a student share it, so the two paths cannot drift into
 * resolving the same entry to different profiles.
 */
final class StudentGuardianRoster
{
    /** Create the writer with its profile and link collaborators. */
    public function __construct(
        private readonly ProfileRepository $profiles,
        private readonly StudentGuardianRepository $guardians,
    ) {}

    /**
     * Apply one roster to a student, leaving them linked to exactly the people in it.
     *
     * Every entry is resolved to a profile before anything is written, so a refusal —
     * an identifier matching nothing, or a profile that is somebody's student — aborts
     * the whole roster instead of applying half of it.
     *
     * The write order is dictated by the partial unique index on `is_primary`: links
     * are dropped and upserted with the flag off, and only then is one of them marked.
     * Setting the new main contact before clearing the old one would violate the index
     * rather than replace the row.
     *
     * @param  list<array<string, mixed>>  $roster
     */
    public function apply(int $studentProfileId, array $roster): void
    {
        $resolved = [];

        foreach ($roster as $entry) {
            $guardian = $this->resolveProfile($entry, studentProfileId: $studentProfileId);

            $resolved[] = [
                'profile' => $guardian,
                'relationship' => GuardianRelationship::from((int) $entry['relationship']),
                'is_primary' => filter_var($entry['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ];
        }

        $keep = array_map(static fn (array $link): int => $link['profile']->id, $resolved);

        $this->guardians->removeLinksOtherThan($studentProfileId, $keep);
        $this->guardians->clearPrimary($studentProfileId);

        foreach ($resolved as $link) {
            $this->guardians->link(
                studentProfileId: $studentProfileId,
                guardianProfileId: $link['profile']->id,
                relationship: $link['relationship'],
            );
        }

        $primary = $this->choosePrimary($resolved);

        if ($primary !== null) {
            $this->guardians->markPrimary($studentProfileId, $primary);
        }
    }

    /**
     * Return the profile one roster entry names, creating it when the entry describes
     * somebody new.
     *
     * A caller who picked somebody already on file sends their identifier, and it is
     * used as given: re-deriving them from a name would defeat the point of picking.
     * A profile holding a student role is refused here rather than in the request,
     * because "may this profile act as a guardian" is a rule about the records
     * involved, not about the shape of the payload.
     *
     * Somebody typed in reuses an existing profile when both the phone number and the
     * name already belong to an eligible person, which is what makes two siblings
     * entered from two forms resolve to one guardian instead of two. Somebody typed in
     * without a phone number always gets a profile of their own, because there is
     * nothing to match on.
     *
     * @param  array<string, mixed>  $entry
     */
    private function resolveProfile(array $entry, int $studentProfileId): Profile
    {
        $profileId = $entry['guardian_profile_id'] ?? null;

        if ($profileId !== null) {
            if ((int) $profileId === $studentProfileId) {
                throw new ActionError(
                    message: 'Học sinh không thể là phụ huynh của chính mình.',
                    code: IdentityError::GuardianNotFound,
                );
            }

            $guardian = $this->profiles->findGuardianCandidate((int) $profileId);

            if (! $guardian instanceof Profile) {
                throw new ActionError(
                    message: 'Không tìm thấy phụ huynh.',
                    code: IdentityError::GuardianNotFound,
                );
            }

            return $guardian;
        }

        $phone = $entry['phone'] ?? null;

        if ($phone !== null) {
            $existing = $this->profiles->findGuardianByPhoneAndName(
                (string) $phone,
                (string) $entry['name'],
            );

            if ($existing instanceof Profile && $existing->id !== $studentProfileId) {
                return $existing;
            }
        }

        return $this->profiles->create([
            'full_name' => $entry['name'],
            'phone' => $phone,
            'gender' => $entry['gender'],
        ]);
    }

    /**
     * Decide which link is the main contact.
     *
     * The roster names one, and when it names none the first entry is taken: a student
     * with somebody linked always has a main contact, because the whole point of the
     * flag is that the school knows who to call first. The request already refuses a
     * roster naming more than one.
     *
     * @param  list<array{profile: Profile, relationship: GuardianRelationship, is_primary: bool}>  $resolved
     */
    private function choosePrimary(array $resolved): ?int
    {
        if ($resolved === []) {
            return null;
        }

        foreach ($resolved as $link) {
            if ($link['is_primary']) {
                return $link['profile']->id;
            }
        }

        return $resolved[0]['profile']->id;
    }
}
