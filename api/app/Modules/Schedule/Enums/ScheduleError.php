<?php

namespace App\Modules\Schedule\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

/**
 * Every expected business failure the Schedule module reports.
 *
 * The `SCHEDULE-0NN` sequence is independent of `ACADEMIC-0NN`. Failures about a
 * record another module owns are reported with that module's declaration instead of
 * being restated here: a missing or unavailable room stays `AcademicError::RoomNotFound`
 * and `RoomInactive`, and the same holds for classes and teachers. Only rules this
 * module owns earn a code below.
 *
 * Shape and uniqueness problems are not listed: Form Requests reject those with
 * Laravel's field-level `422`, which a form can attach to the offending input. These
 * cases cover state rules that span more than one record.
 */
enum ScheduleError: string implements ErrorDeclarationEnum
{
    /** No fixed schedule exists for the requested identifier. */
    case ScheduleTemplateNotFound = 'SCHEDULE-001';

    /**
     * The room is already held at an overlapping time — by another fixed schedule, by a
     * written session, or by a session a fixed schedule projects onto that date. One code
     * covers all three: the caller has to move the room whichever of them is in the way.
     */
    case RoomConflict = 'SCHEDULE-002';

    /**
     * One of the teachers is already teaching at an overlapping time, on a fixed
     * schedule, a written session, or a projected one. Role plays no part.
     */
    case TeacherConflict = 'SCHEDULE-003';

    /** The submitted teacher list names nobody as the main teacher. */
    case MainTeacherRequired = 'SCHEDULE-004';

    /** The submitted teacher list names more than one main teacher. */
    case MultipleMainTeachers = 'SCHEDULE-005';

    /** The submitted teacher list names the same person twice. */
    case DuplicateTeacher = 'SCHEDULE-006';

    /** The schedule would start applying before the class opens. */
    case StartDateBeforeClassStart = 'SCHEDULE-007';

    /** The schedule would still apply after the class has finished. */
    case EndDateAfterClassEnd = 'SCHEDULE-008';

    /** A revision cannot take effect on a date that has already passed. */
    case RevisionEffectiveDateInPast = 'SCHEDULE-009';

    /** The schedule already applies, so it must be closed rather than removed. */
    case ScheduleTemplateAlreadyStarted = 'SCHEDULE-010';

    /** The closing date falls before the date the schedule started applying. */
    case CloseDateBeforeStartDate = 'SCHEDULE-011';

    /** Written sessions still point at the fixed schedule, so it cannot be removed. */
    case ScheduleTemplateHasSessions = 'SCHEDULE-012';

    /** The requested calendar range is wider than one read is allowed to cover. */
    case DateRangeTooWide = 'SCHEDULE-013';

    /** No written session exists for the requested identifier. */
    case SessionNotFound = 'SCHEDULE-014';

    /**
     * No fixed schedule projects a session onto that date, so there is nothing to
     * materialise. This is what stops a lesson being invented on a date the class does
     * not have.
     */
    case VirtualSessionNotProjected = 'SCHEDULE-015';

    /**
     * A session produced by a fixed schedule must say which class it belongs to. The
     * rule was a CHECK constraint in an earlier draft of the schema and now lives in the
     * Actions, so it needs a declaration of its own.
     */
    case SessionClassRequired = 'SCHEDULE-016';

    /**
     * Return the HTTP status this business failure reaches the API boundary with.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::ScheduleTemplateNotFound,
            self::SessionNotFound => 404,

            self::RoomConflict,
            self::TeacherConflict,
            self::ScheduleTemplateAlreadyStarted,
            self::ScheduleTemplateHasSessions => 409,

            self::MainTeacherRequired,
            self::MultipleMainTeachers,
            self::DuplicateTeacher,
            self::StartDateBeforeClassStart,
            self::EndDateAfterClassEnd,
            self::RevisionEffectiveDateInPast,
            self::CloseDateBeforeStartDate,
            self::DateRangeTooWide,
            self::VirtualSessionNotProjected,
            self::SessionClassRequired => 422,
        };
    }
}
