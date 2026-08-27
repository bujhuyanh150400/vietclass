<?php

namespace App\Modules\Auth\Contracts;

use App\Modules\Identity\Enums\UserRole;
use BackedEnum;

/**
 * Defines the contract shared by every module's declaration of the permissions it owns.
 */
interface FeatureEnum extends BackedEnum
{
    /**
     * Return the caller-facing name shown for this permission in the catalogue.
     */
    public function label(): string;

    /**
     * Return the catalogue grouping key that keeps related permissions together.
     */
    public function group(): string;

    /**
     * Return the roles that hold this permission before any per-user override applies.
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array;
}
