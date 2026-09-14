<?php

namespace Database\Seeders;

use App\Modules\Academic\Enums\ClassroomFacility;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use Illuminate\Database\Seeder;

/**
 * Fill a local database with enough rooms to review the room list screen.
 *
 * The distribution is chosen rather than random. The screen shows the first three
 * facilities of a room and counts the rest behind a "+N", so a review needs rooms
 * with none, with exactly the three that fit, and with more than fit. All three
 * availability states appear, one room deliberately has no location so the "Chưa
 * cập nhật" cell can be seen, and capacities spread wide enough for the capacity
 * range filter to have something to narrow.
 *
 * Not registered in `DatabaseSeeder`: it writes illustrative rooms, which is not
 * something `db:seed` should produce by default. Call it explicitly.
 */
final class RoomDemoSeeder extends Seeder
{
    /**
     * Seed the demo rooms, without duplicating anything on a repeated run.
     */
    public function run(): void
    {
        foreach ($this->rooms() as $room) {
            Room::query()->updateOrCreate(
                ['name' => $room['name']],
                [
                    'capacity' => $room['capacity'],
                    'location' => $room['location'],
                    'facilities' => array_map(
                        static fn (ClassroomFacility $facility): int => $facility->value,
                        $room['facilities'],
                    ),
                    'note' => $room['note'],
                    'status' => $room['status'],
                ],
            );
        }
    }

    /**
     * Return the demo rooms and the screen state each one is there to expose.
     *
     * @return list<array{name: string, capacity: int, location: string|null, facilities: list<ClassroomFacility>, note: string|null, status: RoomStatus}>
     */
    private function rooms(): array
    {
        return [
            // Three facilities: the most that fit before a "+N" appears.
            [
                'name' => 'Phòng học 201',
                'capacity' => 40,
                'location' => 'Tầng 2 · Dãy A, gần cầu thang',
                'facilities' => [
                    ClassroomFacility::Projector,
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::Whiteboard,
                ],
                'note' => 'Ưu tiên cho các lớp cần trình chiếu.',
                'status' => RoomStatus::Active,
            ],
            // No facilities at all: the empty "Chưa cập nhật" chip.
            [
                'name' => 'Phòng học 202',
                'capacity' => 36,
                'location' => 'Tầng 2 · Dãy A, cuối hành lang',
                'facilities' => [],
                'note' => null,
                'status' => RoomStatus::Active,
            ],
            // Five facilities: the "+N" chip and its dialog.
            [
                'name' => 'Phòng Tin học',
                'capacity' => 32,
                'location' => 'Tầng 3 · Dãy B',
                'facilities' => [
                    ClassroomFacility::Computer,
                    ClassroomFacility::Projector,
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::Speaker,
                    ClassroomFacility::Wifi,
                ],
                'note' => 'Kiểm tra máy tính trước mỗi buổi học.',
                'status' => RoomStatus::Active,
            ],
            [
                'name' => 'Phòng Thí nghiệm',
                'capacity' => 28,
                'location' => 'Tầng 1 · Dãy B, cạnh kho thiết bị',
                'facilities' => [
                    ClassroomFacility::LabEquipment,
                    ClassroomFacility::Whiteboard,
                ],
                'note' => 'Đang bảo trì hệ thống cấp nước.',
                'status' => RoomStatus::Maintenance,
            ],
            // The widest room, so the capacity sort and range filter have an extreme.
            [
                'name' => 'Phòng Đa năng',
                'capacity' => 120,
                'location' => 'Tầng trệt · Khu nhà chính',
                'facilities' => [
                    ClassroomFacility::Projector,
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::Speaker,
                    ClassroomFacility::Microphone,
                    ClassroomFacility::SmartTv,
                    ClassroomFacility::Wifi,
                ],
                'note' => null,
                'status' => RoomStatus::Active,
            ],
            [
                'name' => 'Phòng học 101',
                'capacity' => 40,
                'location' => 'Tầng 1 · Dãy A, gần văn phòng',
                'facilities' => [
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::Whiteboard,
                ],
                'note' => null,
                'status' => RoomStatus::Active,
            ],
            // No location: the "Chưa cập nhật" cell in the location column.
            [
                'name' => 'Phòng Ngoại ngữ',
                'capacity' => 24,
                'location' => null,
                'facilities' => [
                    ClassroomFacility::Computer,
                    ClassroomFacility::Speaker,
                    ClassroomFacility::SmartBoard,
                    ClassroomFacility::AirConditioner,
                ],
                'note' => 'Chờ thay mới tai nghe tại dãy bàn cuối.',
                'status' => RoomStatus::Maintenance,
            ],
            // Neither location nor facilities, and out of circulation.
            [
                'name' => 'Phòng học cũ',
                'capacity' => 30,
                'location' => null,
                'facilities' => [],
                'note' => 'Tạm ngừng sử dụng cho đến khi có kế hoạch cải tạo.',
                'status' => RoomStatus::Inactive,
            ],
            // The smallest room, the other end of the capacity range.
            [
                'name' => 'Phòng Tư vấn',
                'capacity' => 8,
                'location' => 'Tầng 1 · Dãy A, cạnh phòng y tế',
                'facilities' => [
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::Wifi,
                ],
                'note' => null,
                'status' => RoomStatus::Active,
            ],
            [
                'name' => 'Phòng Hội trường',
                'capacity' => 200,
                'location' => 'Tầng 4 · Khu nhà chính',
                'facilities' => [
                    ClassroomFacility::Projector,
                    ClassroomFacility::Speaker,
                    ClassroomFacility::Microphone,
                    ClassroomFacility::AirConditioner,
                    ClassroomFacility::SmartTv,
                    ClassroomFacility::Wifi,
                    ClassroomFacility::SmartBoard,
                ],
                'note' => 'Đặt trước ít nhất một tuần.',
                'status' => RoomStatus::Inactive,
            ],
        ];
    }
}
