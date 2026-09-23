<?php

namespace App\Modules\Academic\Services;

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\GuardianRelationship;
use App\Modules\Academic\Enums\AcademicPersonError;
use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Repositories\ProfileRepository;
use App\Modules\Academic\Repositories\StudentGuardianRepository;

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
 * Creating and editing a student share it, so both paths link only existing
 * role-pure guardian profiles and cannot drift into creating contacts implicitly.
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
        $primaryCount = 0;

        foreach ($roster as $entry) {
            $guardian = $this->resolveProfile($entry, studentProfileId: $studentProfileId);
            $isPrimary = filter_var($entry['is_primary'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $primaryCount += $isPrimary ? 1 : 0;

            $resolved[] = [
                'profile' => $guardian,
                'relationship' => GuardianRelationship::from((int) $entry['relationship']),
                'is_primary' => $isPrimary,
            ];
        }

        if ($resolved !== [] && $primaryCount !== 1) {
            throw new ActionError(
                message: 'Danh sách phụ huynh phải chọn chính xác một liên hệ chính.',
                code: AcademicPersonError::PrimaryGuardianReplacementRequired,
            );
        }

        $currentLinks = $this->guardians->forStudent($studentProfileId);
        $currentPrimary = $currentLinks->firstWhere('is_primary', true);
        $incomingByProfile = collect($resolved)->keyBy(fn (array $link): int => $link['profile']->id);
        if ($currentPrimary !== null) {
            $replacement = $incomingByProfile->get($currentPrimary->guardian_profile_id);
            $incomingPrimary = collect($resolved)->firstWhere('is_primary', true);
            $remaining = $currentLinks->whereNotIn('guardian_profile_id', $incomingByProfile->keys());
            if ($incomingByProfile->isNotEmpty() && ($replacement === null || ! $replacement['is_primary']) && $remaining->isNotEmpty() && $incomingPrimary === null) {
                throw new ActionError(
                    message: 'Vui lòng chọn người liên hệ chính thay thế cho học sinh.',
                    code: AcademicPersonError::PrimaryGuardianReplacementRequired,
                );
            }
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

        foreach ($resolved as $link) {
            if ($link['is_primary']) {
                $this->guardians->markPrimary($studentProfileId, $link['profile']->id);
            }
        }
    }

    /**
     * Return the existing role-pure profile one roster entry names.
     *
     * A caller who picked somebody already on file sends their identifier, and it is
     * used as given: re-deriving them from a name would defeat the point of picking.
     * A profile holding a student role is refused here rather than in the request,
     * because "may this profile act as a guardian" is a rule about the records
     * involved, not about the shape of the payload.
     *
     * A student payload never creates or reuses a profile from contact fields; the
     * Admin creates guardians through the independent Guardian CRUD surface first.
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
                    code: AcademicPersonError::GuardianNotFound,
                );
            }

            $guardian = $this->profiles->findGuardianCandidate((int) $profileId);

            if (! $guardian instanceof Profile) {
                throw new ActionError(
                    message: 'Không tìm thấy phụ huynh.',
                    code: AcademicPersonError::GuardianNotFound,
                );
            }

            return $guardian;
        }

        throw new ActionError(
            message: 'Vui lòng chọn một phụ huynh có sẵn.',
            code: AcademicPersonError::GuardianNotFound,
        );
    }
}
