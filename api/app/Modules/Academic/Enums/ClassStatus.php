<?php

namespace App\Modules\Academic\Enums;

use App\Core\Support\IntBackedEnum;

enum ClassStatus: int
{
    use IntBackedEnum;

    case Active = 0;
    case Ended = 1;
}
