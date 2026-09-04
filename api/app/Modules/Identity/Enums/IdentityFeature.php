<?php

namespace App\Modules\Identity\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use Illuminate\Support\Str;

/**
 * Every permission the Identity module owns.
 *
 * Codes are stable identifiers stored in the permission catalogue and referenced from
 * route definitions; renaming one silently withdraws it from anyone who holds it.
 */
enum IdentityFeature: string implements FeatureEnum
{
    /** See the teacher list. */
    case TeacherList = 'teacher.list';

    /** See one teacher profile in detail. */
    case TeacherView = 'teacher.view';

    /** Create a teacher profile together with its login account. */
    case TeacherCreate = 'teacher.create';

    /** Change a teacher profile, including its account password. */
    case TeacherUpdate = 'teacher.update';

    /** Lock or unlock a teacher's login account. */
    case TeacherToggleActive = 'teacher.toggle_active';

    /** See the student list. */
    case StudentList = 'student.list';

    /** See one student profile in detail. */
    case StudentView = 'student.view';

    /** Create a student profile together with its login account. */
    case StudentCreate = 'student.create';

    /** Change a student profile, including its account password. */
    case StudentUpdate = 'student.update';

    /** Lock or unlock a student's login account. */
    case StudentToggleActive = 'student.toggle_active';

    /** Change a profile's independently persisted avatar. */
    case ProfileAvatarUpdate = 'profile.avatar_update';

    /**
     * Return the caller-facing name shown for this permission in the catalogue.
     */
    public function label(): string
    {
        return match ($this) {
            self::TeacherList => 'Xem danh sách giáo viên',
            self::TeacherView => 'Xem chi tiết giáo viên',
            self::TeacherCreate => 'Tạo hồ sơ giáo viên',
            self::TeacherUpdate => 'Sửa hồ sơ giáo viên',
            self::TeacherToggleActive => 'Khóa hoặc mở tài khoản giáo viên',
            self::StudentList => 'Xem danh sách học sinh',
            self::StudentView => 'Xem chi tiết học sinh',
            self::StudentCreate => 'Tạo hồ sơ học sinh',
            self::StudentUpdate => 'Sửa hồ sơ học sinh',
            self::StudentToggleActive => 'Khóa hoặc mở tài khoản học sinh',
            self::ProfileAvatarUpdate => 'Đổi ảnh đại diện hồ sơ',
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
     * Teacher and student administration remains administrator-only, while every account
     * may update its own avatar; the Action applies the profile-specific ownership check.
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::ProfileAvatarUpdate => UserRole::cases(),
            default => [UserRole::Admin],
        };
    }
}
