<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

enum UserRole: int
{
    use IntBackedEnum;

    case Admin = 0;
    case Teacher = 1;
    case Staff = 2;
    case Student = 3;
}
