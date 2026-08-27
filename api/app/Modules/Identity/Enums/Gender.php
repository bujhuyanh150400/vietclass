<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

enum Gender: int
{
    use IntBackedEnum;

    case Male = 0;
    case Female = 1;
    case Other = 2;
}
