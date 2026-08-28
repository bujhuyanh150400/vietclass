<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

enum TeacherStatus: int
{
    use IntBackedEnum;

    case Active = 0;
    case Inactive = 1;
}
