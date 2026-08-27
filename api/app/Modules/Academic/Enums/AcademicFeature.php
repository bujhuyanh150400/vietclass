<?php

namespace App\Modules\Academic\Enums;

use App\Modules\Auth\Contracts\FeatureEnum;
use App\Modules\Identity\Enums\UserRole;
use Illuminate\Support\Str;

/**
 * Every permission the Academic module owns.
 *
 * Codes are stable identifiers stored in the permission catalogue and referenced from
 * route definitions; renaming one silently withdraws it from anyone who holds it.
 */
enum AcademicFeature: string implements FeatureEnum
{
    /** See the subject list. */
    case SubjectList = 'subject.list';

    /** See one subject in detail. */
    case SubjectView = 'subject.view';

    /** Create a subject. */
    case SubjectCreate = 'subject.create';

    /** Change a subject's name or description. */
    case SubjectUpdate = 'subject.update';

    /** Lock or unlock a subject for use by new classes. */
    case SubjectToggleActive = 'subject.toggle_active';

    /** Remove a subject no class references. */
    case SubjectDelete = 'subject.delete';

    /** See the class list. */
    case ClassList = 'class.list';

    /** See one class in detail, including its roster. */
    case ClassView = 'class.view';

    /** Create a class. */
    case ClassCreate = 'class.create';

    /** Change a class, excluding its code and opening date. */
    case ClassUpdate = 'class.update';

    /** Move a class between the running and finished states. */
    case ClassChangeStatus = 'class.change_status';

    /** Enrol students into a class. */
    case ClassAddStudent = 'class.add_student';

    /** Correct the join date, leave date, or note on one enrolment. */
    case ClassUpdateStudentEnrollment = 'class.update_student_enrollment';

    /** Move a student from one class to another class of the same subject. */
    case ClassTransferStudent = 'class.transfer_student';

    /** End a student's membership of a class. */
    case ClassRemoveStudent = 'class.remove_student';

    /**
     * Return the caller-facing name shown for this permission in the catalogue.
     */
    public function label(): string
    {
        return match ($this) {
            self::SubjectList => 'Xem danh sách môn học',
            self::SubjectView => 'Xem chi tiết môn học',
            self::SubjectCreate => 'Tạo môn học',
            self::SubjectUpdate => 'Sửa môn học',
            self::SubjectToggleActive => 'Khóa hoặc mở môn học',
            self::SubjectDelete => 'Xóa môn học',
            self::ClassList => 'Xem danh sách lớp học',
            self::ClassView => 'Xem chi tiết lớp học',
            self::ClassCreate => 'Tạo lớp học',
            self::ClassUpdate => 'Sửa lớp học',
            self::ClassChangeStatus => 'Đổi trạng thái lớp học',
            self::ClassAddStudent => 'Thêm học sinh vào lớp',
            self::ClassUpdateStudentEnrollment => 'Sửa thông tin ghi danh',
            self::ClassTransferStudent => 'Chuyển lớp cho học sinh',
            self::ClassRemoveStudent => 'Cho học sinh nghỉ lớp',
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
     * This release grants the Academic module to administrators only. Teacher access
     * in the fork depends on schedule-conflict checks that no module implements yet,
     * so opening it here would ship a rule that cannot be enforced. This method is
     * the single place to widen access once the schedule module lands.
     *
     * @return list<UserRole>
     */
    public function defaultRoles(): array
    {
        return [UserRole::Admin];
    }
}
