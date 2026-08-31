<?php

namespace App\Modules\Schedule\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * The part a teacher plays on a schedule.
 *
 * The role does not soften the double-booking rule: an assistant is blocked from a
 * clashing time slot exactly as a main teacher is, because one person cannot be in
 * two rooms at once.
 */
enum ScheduleTeacherRole: int
{
    use IntBackedEnum;

    case MainTeacher = 0;
    case Assistant = 1;

    /**
     * Return the Vietnamese label presented for this teaching role.
     */
    public function label(): string
    {
        return match ($this) {
            self::MainTeacher => 'Giáo viên chính',
            self::Assistant => 'Trợ giảng',
        };
    }
}
