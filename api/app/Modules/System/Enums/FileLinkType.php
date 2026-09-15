<?php

namespace App\Modules\System\Enums;

use App\Core\Support\IntBackedEnum;

enum FileLinkType: int
{
    use IntBackedEnum;

    case ProfileAvatar = 0;
}
