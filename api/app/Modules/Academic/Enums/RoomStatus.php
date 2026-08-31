<?php

namespace App\Modules\Academic\Enums;

use App\Core\Support\IntBackedEnum;

enum RoomStatus: int
{
    use IntBackedEnum;

    case Active = 0;
    case Inactive = 1;
    case Maintenance = 2;

    /**
     * Return the Vietnamese label presented for this room availability state.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Hoạt động',
            self::Inactive => 'Tạm khóa',
            self::Maintenance => 'Bảo trì',
        };
    }
}
