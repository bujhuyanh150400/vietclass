<?php

namespace App\Core\Support;

trait IntBackedEnum
{
    /**
     * Return the integer values persisted for every enum case.
     *
     * @return list<int>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $case): int => $case->value,
            self::cases(),
        );
    }
}
