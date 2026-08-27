<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * School grade, where the stored value equals the grade number and `0` covers the
 * pre-primary level.
 */
enum GradeLevel: int
{
    use IntBackedEnum;

    case Grade0 = 0;
    case Grade1 = 1;
    case Grade2 = 2;
    case Grade3 = 3;
    case Grade4 = 4;
    case Grade5 = 5;
    case Grade6 = 6;
    case Grade7 = 7;
    case Grade8 = 8;
    case Grade9 = 9;
    case Grade10 = 10;
    case Grade11 = 11;
    case Grade12 = 12;
}
