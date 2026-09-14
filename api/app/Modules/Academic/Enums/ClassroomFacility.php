<?php

namespace App\Modules\Academic\Enums;

use App\Core\Support\IntBackedEnum;

enum ClassroomFacility: int
{
    use IntBackedEnum;

    case Projector = 0;
    case AirConditioner = 1;
    case Computer = 2;
    case SmartTv = 3;
    case Speaker = 4;
    case Microphone = 5;
    case Whiteboard = 6;
    case SmartBoard = 7;
    case LabEquipment = 8;
    case Wifi = 9;

    /**
     * Return the Vietnamese label presented for this classroom facility.
     */
    public function label(): string
    {
        return match ($this) {
            self::Projector => 'Máy chiếu',
            self::AirConditioner => 'Điều hòa',
            self::Computer => 'Máy tính',
            self::SmartTv => 'Tivi thông minh',
            self::Speaker => 'Loa',
            self::Microphone => 'Micro',
            self::Whiteboard => 'Bảng trắng',
            self::SmartBoard => 'Bảng thông minh',
            self::LabEquipment => 'Thiết bị thí nghiệm',
            self::Wifi => 'Wifi',
        };
    }
}
