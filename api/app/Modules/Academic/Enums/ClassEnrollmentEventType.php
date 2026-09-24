<?php

namespace App\Modules\Academic\Enums;

enum ClassEnrollmentEventType: int
{
    /** A new enrollment period began. */
    case Enrolled = 0;

    /** Enrollment details were corrected. */
    case Updated = 1;

    /** The student left the class. */
    case Left = 2;

    /** A transfer closed the source period. */
    case TransferredOut = 3;

    /** A transfer opened the target period. */
    case TransferredIn = 4;

    /** The class closed the active period. */
    case ClosedWithClass = 5;
}
