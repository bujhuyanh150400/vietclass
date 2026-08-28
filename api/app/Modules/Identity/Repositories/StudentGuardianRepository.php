<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Enums\GuardianRelationship;
use App\Modules\Identity\Models\StudentGuardian;

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
     * Record a guardian as the main contact for a student.
     *
     * The pair is matched first so re-submitting the same guardian updates the link
     * rather than colliding with the unique constraint on the pair.
     */
    public function linkPrimary(
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
                'is_primary' => true,
            ],
        );
    }

    /**
     * Count how many students currently list the given profile as a guardian.
     *
     * Used to decide whether a guardian profile may be edited in place: more than
     * one link means it is shared with a sibling and must never be mutated from
     * just one student's form.
     */
    public function countLinksTo(int $guardianProfileId): int
    {
        return $this->modelQuery()->where('guardian_profile_id', $guardianProfileId)->count();
    }
}
