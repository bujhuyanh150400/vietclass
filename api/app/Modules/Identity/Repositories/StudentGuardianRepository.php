<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Models\StudentGuardian;
use Illuminate\Database\Eloquent\Collection;

final class StudentGuardianRepository extends BaseRepository
{
    /** This repository is backed by the StudentGuardian model. */
    protected function modelClass(): ?string
    {
        return StudentGuardian::class;
    }

    /** This repository does not query a DB table directly. */
    protected function table(): ?string
    {
        return null;
    }

    /**
     * Record a guardian for a student without deciding who the main contact is.
     *
     * The pair is matched first so re-submitting the same guardian updates the link
     * rather than colliding with the unique constraint on the pair. `is_primary` is
     * left false here and set afterwards by `markPrimary`, because the table carries a
     * partial unique index allowing one primary row per student: writing a second
     * primary before the first is cleared is a constraint violation, not a last-write-
     * wins update.
     */
    public function link(
        int $studentProfileId,
        int $guardianProfileId,
        GuardianRelationship $relationship,
    ): StudentGuardian {
        return $this->modelQuery()->updateOrCreate(
            [
                'student_profile_id' => $studentProfileId,
                'guardian_profile_id' => $guardianProfileId,
            ],
            [
                'relationship' => $relationship,
                'is_primary' => false,
            ],
        );
    }

    /**
     * Return every link recorded for one student.
     *
     * @return Collection<int, StudentGuardian>
     */
    public function forStudent(int $studentProfileId): Collection
    {
        return $this->modelQuery()->where('student_profile_id', $studentProfileId)->get();
    }

    /**
     * Drop the student's links to everybody not in the given set of guardian profiles.
     *
     * An empty set removes every link, which is how a roster submitted as an empty
     * array unlinks all of them.
     *
     * @param  list<int>  $keepGuardianProfileIds
     */
    public function removeLinksOtherThan(int $studentProfileId, array $keepGuardianProfileIds): void
    {
        $query = $this->modelQuery()->where('student_profile_id', $studentProfileId);

        if ($keepGuardianProfileIds !== []) {
            $query->whereNotIn('guardian_profile_id', $keepGuardianProfileIds);
        }

        $query->delete();
    }

    /**
     * Clear the main-contact flag on every link a student has.
     *
     * Always run before marking a new primary, so the partial unique index never sees
     * two primary rows for one student mid-write.
     */
    public function clearPrimary(int $studentProfileId): void
    {
        $this->modelQuery()
            ->where('student_profile_id', $studentProfileId)
            ->where('is_primary', true)
            ->update(['is_primary' => false]);
    }

    /** Mark one existing link as the student's main contact. */
    public function markPrimary(int $studentProfileId, int $guardianProfileId): void
    {
        $this->modelQuery()
            ->where('student_profile_id', $studentProfileId)
            ->where('guardian_profile_id', $guardianProfileId)
            ->update(['is_primary' => true]);
    }
}
