<?php

namespace App\Modules\FileManagement\Enums;

use App\Core\Support\IntBackedEnum;

enum FileLinkType: int
{
    use IntBackedEnum;

    case ProfileAvatar = 0;
}
