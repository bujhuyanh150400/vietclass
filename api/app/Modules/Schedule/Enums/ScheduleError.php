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

    /** Another fixed schedule already holds the room at an overlapping time. */
    case RoomConflict = 'SCHEDULE-002';

    /** One of the teachers already has a fixed schedule at an overlapping time. */
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

    /**
     * Return the HTTP status this business failure reaches the API boundary with.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::ScheduleTemplateNotFound => 404,

            self::RoomConflict,
            self::TeacherConflict,
            self::ScheduleTemplateAlreadyStarted => 409,

            self::MainTeacherRequired,
            self::MultipleMainTeachers,
            self::DuplicateTeacher,
            self::StartDateBeforeClassStart,
            self::EndDateAfterClassEnd,
            self::RevisionEffectiveDateInPast,
            self::CloseDateBeforeStartDate => 422,
        };
    }
}
