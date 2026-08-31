<?php

namespace App\Modules\Schedule\Enums;

use App\Core\Support\IntBackedEnum;
use Carbon\CarbonInterface;

/**
 * Weekday a fixed schedule repeats on, counted from Monday.
 *
 * Stored enums in this system start at `0`, so this does not match Carbon's ISO
 * numbering. The two conversion helpers below are the only place that offset is
 * applied; nothing else should add or subtract one.
 */
enum DayOfWeek: int
{
    use IntBackedEnum;

    case Monday = 0;
    case Tuesday = 1;
    case Wednesday = 2;
    case Thursday = 3;
    case Friday = 4;
    case Saturday = 5;
    case Sunday = 6;

    /**
     * Return the Vietnamese label presented for this weekday.
     */
    public function label(): string
    {
        return match ($this) {
            self::Monday => 'Thứ 2',
            self::Tuesday => 'Thứ 3',
            self::Wednesday => 'Thứ 4',
            self::Thursday => 'Thứ 5',
            self::Friday => 'Thứ 6',
            self::Saturday => 'Thứ 7',
            self::Sunday => 'Chủ nhật',
        };
    }

    /**
     * Return this weekday in Carbon's ISO numbering, where Monday is `1`, so a stored
     * value can be compared against `CarbonInterface::dayOfWeekIso`.
     */
    public function toIsoWeekday(): int
    {
        return $this->value + 1;
    }

    /**
     * Return the weekday a given date falls on, so the projection can walk a date
     * range and match it against stored schedules.
     */
    public static function fromDate(CarbonInterface $date): self
    {
        return self::from($date->dayOfWeekIso - 1);
    }
}
