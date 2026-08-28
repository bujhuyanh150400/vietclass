<?php

namespace App\Modules\Identity\Enums;

use App\Core\Support\IntBackedEnum;

/**
 * Quan hệ của người giám hộ với học sinh. Không phải phụ huynh nào cũng là bố hoặc
 * mẹ, nên trường hợp thứ ba là bắt buộc chứ không phải phần dư.
 */
enum GuardianRelationship: int
{
    use IntBackedEnum;

    case Father = 0;
    case Mother = 1;
    case Other = 2;
}
