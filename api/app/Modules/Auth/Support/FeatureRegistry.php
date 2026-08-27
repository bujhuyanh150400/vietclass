<?php

namespace App\Modules\Auth\Support;

use App\Modules\Auth\Contracts\FeatureEnum;
use InvalidArgumentException;

/**
 * Collects the permission declarations every module owns, so authorization can be
 * resolved centrally without any module having to know about another.
 */
final class FeatureRegistry
{
    /** @var array<string, FeatureEnum> */
    private array $features = [];

    /**
     * Add every case of a module's feature enum to the application-wide catalogue.
     *
     * @param  class-string<FeatureEnum>  $featureEnum
     */
    public function register(string $featureEnum): void
    {
        if (! is_subclass_of($featureEnum, FeatureEnum::class)) {
            throw new InvalidArgumentException(
                "[{$featureEnum}] không phải là một khai báo quyền hợp lệ.",
            );
        }

        foreach ($featureEnum::cases() as $case) {
            $this->features[$case->value] = $case;
        }
    }

    /**
     * Return every declared permission, keyed by its stable code.
     *
     * @return array<string, FeatureEnum>
     */
    public function all(): array
    {
        return $this->features;
    }

    /**
     * Resolve one permission declaration by its stable code, or null when no module owns it.
     */
    public function find(string $code): ?FeatureEnum
    {
        return $this->features[$code] ?? null;
    }
}
