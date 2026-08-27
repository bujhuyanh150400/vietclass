<?php

namespace App\Modules\Academic\Enums;

use App\Core\Contracts\ErrorDeclarationEnum;

/**
 * Every expected business failure the Academic module reports.
 *
 * Shape and uniqueness problems are not listed here: Form Requests reject those with
 * Laravel's field-level `422`, which a form can attach to the offending input. These
 * cases cover state rules that span more than one record.
 */
enum AcademicError: string implements ErrorDeclarationEnum
{
    /** No subject exists for the requested identifier. */
    case SubjectNotFound = 'ACADEMIC-001';

    /** The subject is still referenced by classes, so it cannot be locked or removed. */
    case SubjectInUse = 'ACADEMIC-002';

    /** The subject is locked and cannot be assigned to a class. */
    case SubjectInactive = 'ACADEMIC-003';

    /** No teacher exists for the requested identifier. */
    case TeacherNotFound = 'ACADEMIC-004';

    /** The teacher has left and cannot be assigned to a class. */
    case TeacherInactive = 'ACADEMIC-005';

    /** No class exists for the requested identifier. */
    case ClassNotFound = 'ACADEMIC-006';

    /** The class has finished, which freezes every enrolment operation on it. */
    case ClassNotActive = 'ACADEMIC-007';

    /** The new capacity is below the number of students currently enrolled. */
    case ClassCapacityBelowEnrolled = 'ACADEMIC-008';

    /** The class already holds as many students as its capacity allows. */
    case ClassFull = 'ACADEMIC-009';

    /** No student exists for the requested identifier. */
    case StudentNotFound = 'ACADEMIC-010';

    /** No enrolment exists for the requested identifier. */
    case EnrollmentNotFound = 'ACADEMIC-011';

    /** The enrolment has already ended, so it cannot be transferred or closed again. */
    case EnrollmentNotActive = 'ACADEMIC-012';

    /** The student already holds a running enrolment in this class. */
    case StudentAlreadyEnrolled = 'ACADEMIC-013';

    /** The join date falls before the class opening date. */
    case EnrollmentBeforeClassStart = 'ACADEMIC-014';

    /** The leave date falls before the join date. */
    case LeftBeforeEnrolled = 'ACADEMIC-015';

    /** A transfer target must teach the same subject as the class being left. */
    case TransferSubjectMismatch = 'ACADEMIC-016';

    /** A transfer target must be a class that is still running. */
    case TransferTargetNotActive = 'ACADEMIC-017';

    /**
     * Return the HTTP status this business failure reaches the API boundary with.
     */
    public function httpStatus(): int
    {
        return match ($this) {
            self::SubjectNotFound,
            self::TeacherNotFound,
            self::ClassNotFound,
            self::StudentNotFound,
            self::EnrollmentNotFound => 404,

            self::SubjectInUse,
            self::ClassNotActive,
            self::ClassFull,
            self::EnrollmentNotActive,
            self::StudentAlreadyEnrolled => 409,

            self::SubjectInactive,
            self::TeacherInactive,
            self::ClassCapacityBelowEnrolled,
            self::EnrollmentBeforeClassStart,
            self::LeftBeforeEnrolled,
            self::TransferSubjectMismatch,
            self::TransferTargetNotActive => 422,
        };
    }
}
