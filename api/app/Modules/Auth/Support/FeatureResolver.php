<?php

namespace App\Modules\Auth\Support;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Auth\Repositories\FeatureUserRepository;
use App\Modules\Identity\Models\User;

/**
 * Answers whether a user holds a permission by combining the role defaults declared
 * in code with the per-user overrides stored in the database.
 */
final class FeatureResolver
{
    /** @var array<int, list<string>> */
    private array $resolved = [];

    /**
     * Create the resolver with the declaration catalogue and the override store.
     */
    public function __construct(
        private readonly FeatureRegistry $registry,
        private readonly FeatureUserRepository $overrides,
    ) {}

    /**
     * Report whether the user currently holds one declared permission.
     */
    public function allows(User $user, FeatureEnum $feature): bool
    {
        return in_array($feature->value, $this->effectiveCodes($user), true);
    }

    /**
     * Return every permission code the user currently holds, resolved once per user
     * for the lifetime of the request so a route checking several gates costs one query.
     *
     * @return list<string>
     */
    public function effectiveCodes(User $user): array
    {
        return $this->resolved[(int) $user->id] ??= $this->resolve($user);
    }

    /**
     * Discard the memoised result so a permission change takes effect immediately.
     */
    public function flush(): void
    {
        $this->resolved = [];
    }

    /**
     * Combine role defaults with grant and deny overrides for one user.
     *
     * Only declared codes are considered, so a catalogue row left behind by a removed
     * module can never grant anything.
     *
     * @return list<string>
     */
    private function resolve(User $user): array
    {
        // A deactivated account keeps its bearer token until that token expires, so
        // the permission layer has to refuse it rather than trust authentication alone.
        if (! $user->is_active) {
            return [];
        }

        $overrides = $this->overrides->overridesFor((int) $user->id);
        $codes = [];

        foreach ($this->registry->all() as $code => $feature) {
            $granted = $overrides[$code]
                ?? in_array($user->role, $feature->defaultRoles(), true);

            if ($granted) {
                $codes[] = $code;
            }
        }

        return $codes;
    }
}
