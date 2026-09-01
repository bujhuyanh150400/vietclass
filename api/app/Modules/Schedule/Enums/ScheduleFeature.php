<?php

namespace App\Modules\Schedule\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Support\Str;

/**
 * Every permission the Schedule module owns.
 *
 * Codes are stable identifiers stored in the permission catalogue and referenced from
 * route definitions; renaming one silently withdraws it from anyone who holds it.
 *
 * Reading the calendar is one permission whether the session read back is a written row
 * or a projected one: a reader asks what is on for a date range and should not need a
 * different permission depending on whether somebody has already touched a lesson.
 * Materialising a projected session is a write, so it sits with the administrators.
 */
enum ScheduleFeature: string implements FeatureEnum
{
    /** See the fixed schedules of a class. */
    case TemplateList = 'schedule.template.list';

    /** Open a weekly slot for a class. */
    case TemplateCreate = 'schedule.template.create';

    /** Revise, close, or restaff a fixed schedule. */
    case TemplateUpdate = 'schedule.template.update';

    /** Remove a fixed schedule that has not started applying. */
    case TemplateDelete = 'schedule.template.delete';

    /** Read the calendar over a date range, projected sessions included. */
    case SessionList = 'schedule.session.list';

    /** Read one written session. */
    case SessionView = 'schedule.session.view';

    /** Materialise a projected session into a written one. */
    case SessionManage = 'schedule.session.manage';

    /**
     * Return the caller-facing name shown for this permission in the catalogue.
     */
    public function label(): string
    {
        return match ($this) {
            self::TemplateList => 'Xem danh sách lịch cố định',
            self::TemplateCreate => 'Tạo lịch cố định',
            self::TemplateUpdate => 'Sửa lịch cố định',
            self::TemplateDelete => 'Xóa lịch cố định',
            self::SessionList => 'Xem lịch học theo khoảng ngày',
            self::SessionView => 'Xem chi tiết buổi học',
            self::SessionManage => 'Quản lý buổi học',
        };
    }

    /**
     * Return the catalogue grouping key, which is the entity segment of the code.
     */
    public function group(): string
    {
        return Str::before($this->value, '.');
    }

    /**
     * Return the roles that hold this permission before any per-user override.
     *
     * Writing belongs to administrators alone, and materialising a projected session is
     * a write however much it reads like a read. Reading is wider: a teacher needs to see
     * the slots and the lessons they are on, so the two list permissions and the session
     * detail are theirs as well. What a teacher then sees is narrowed inside the Action,
     * because this method — and the middleware reading it — can only answer yes or no,
     * not "these rows".
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::TemplateList,
            self::SessionList,
            self::SessionView => [UserRole::Admin, UserRole::Teacher],

            self::TemplateCreate,
            self::TemplateUpdate,
            self::TemplateDelete,
            self::SessionManage => [UserRole::Admin],
        };
    }
}
