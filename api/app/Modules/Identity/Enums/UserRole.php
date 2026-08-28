<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

enum UserRole: int
{
    use IntBackedEnum;

    case Admin = 0;
    case Teacher = 1;
    case Student = 2;
    case Guardian = 3;
}
