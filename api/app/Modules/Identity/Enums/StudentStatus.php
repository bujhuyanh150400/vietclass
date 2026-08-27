<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * Renumbered from the fork, where these cases started at 1, because stored enum
 * values start at 0 in this repository.
 */
enum StudentStatus: int
{
    use IntBackedEnum;

    case Studying = 0;
    case Paused = 1;
    case Stopped = 2;
}
