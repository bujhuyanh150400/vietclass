<?php

namespace App\Modules\Identity\Repositories;

use App\Core\Repositories\BaseRepository;
use App\Modules\Identity\Models\Profile;

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

    /**
     * Find the oldest profile carrying a phone number.
     *
     * The column is deliberately not unique, so this returns the first match rather
     * than the only one. It exists to let a guardian entered twice from two siblings'
     * forms resolve to one profile instead of two.
     */
    public function findByPhone(string $phone): ?Profile
    {
        return $this->modelQuery()
            ->where('phone', $phone)
            ->orderBy('id')
            ->first();
    }
}
