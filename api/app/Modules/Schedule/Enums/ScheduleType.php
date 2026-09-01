<?php

namespace App\Modules\Schedule\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * What kind of occasion a session is.
 *
 * The fork had a fourth case, `Holiday`. It is not carried over: a holiday is a
 * property of the calendar, not a lesson somebody teaches, and it belongs to the
 * school-events feature which is outside this module's scope.
 */
enum ScheduleType: int
{
    use IntBackedEnum;

    case Regular = 0;
    case Makeup = 1;
    case Extra = 2;

    /**
     * Return the Vietnamese label presented for this kind of session.
     */
    public function label(): string
    {
        return match ($this) {
            self::Regular => 'Lịch chính',
            self::Makeup => 'Học bù',
            self::Extra => 'Tăng cường',
        };
    }
}
