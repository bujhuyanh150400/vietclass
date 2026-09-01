<?php

namespace App\Modules\Schedule\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * Where a session stands in its own life.
 *
 * Two of the fork's cases are gone. `Ongoing` was derivable from the clock, so storing
 * it only created a value that goes stale unless something keeps writing it. And
 * `Rescheduled` described two different things: moving a session is editing its `date`,
 * while cancelling one and teaching it later is a cancellation plus a make-up linked
 * back to it — both already expressible without a status of their own.
 *
 * A session only reaches `Completed` through an explicit administrator action; no cron
 * advances it. The deliberate consequence is that a session whose date has passed while
 * still `Pending` stays editable, which is what lets an administrator repair data that
 * was never entered.
 */
enum ScheduleStatus: int
{
    use IntBackedEnum;

    case Pending = 0;
    case Completed = 1;
    case Cancelled = 2;

    /**
     * Return the Vietnamese label presented for this session status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Chưa diễn ra',
            self::Completed => 'Đã diễn ra',
            self::Cancelled => 'Đã huỷ',
        };
    }
}
