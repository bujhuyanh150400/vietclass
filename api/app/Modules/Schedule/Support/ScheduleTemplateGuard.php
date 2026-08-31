<?php

namespace App\Modules\Schedule\Support;

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Repositories\ClassRepository;
use App\Modules\Academic\Repositories\RoomRepository;
use App\Modules\Schedule\Enums\ScheduleError;
use Illuminate\Support\Carbon;

/**
 * Verifies the records and dates a fixed schedule hangs off, before anything is
 * written.
 *
 * Creating a schedule and revising a running one have to apply the same rules — a
 * revision that accepted a locked room or a date outside the class's life would be a
 * way around the create path. Both go through this class so they agree by construction
 * rather than by two copies of the same conditions staying in step.
 *
 * Failures about a class, a room, or a teacher keep the `AcademicError` declaration
 * that module already publishes for them; only the rules this module owns get a
 * `ScheduleError`.
 */
final class ScheduleTemplateGuard
{
    /**
     * Create the guard with the stores holding the records it verifies.
     */
    public function __construct(
        private readonly ClassRepository $classes,
        private readonly RoomRepository $rooms,
    ) {}

    /**
     * Return the class a schedule is being written for, refusing one that has finished.
     *
     * @throws ActionError when the class is missing or no longer running
     */
    public function requireOpenClass(int $classId): SchoolClass
    {
        $class = $this->classes->findById($classId);

        if (! $class instanceof SchoolClass) {
            throw new ActionError(
                message: 'Không tìm thấy lớp học.',
                code: AcademicError::ClassNotFound,
            );
        }

        if ($class->status !== ClassStatus::Active) {
            throw new ActionError(
                message: 'Lớp học đã kết thúc, không thể xếp lịch.',
                code: AcademicError::ClassNotActive,
            );
        }

        return $class;
    }

    /**
     * Return the class a schedule is being read for, whatever state it is in.
     *
     * Reading is not writing: a finished class still has a schedule history worth
     * showing, so only the existence check applies here.
     *
     * @throws ActionError when the class is missing
     */
    public function requireClass(int $classId): SchoolClass
    {
        $class = $this->classes->findById($classId);

        if (! $class instanceof SchoolClass) {
            throw new ActionError(
                message: 'Không tìm thấy lớp học.',
                code: AcademicError::ClassNotFound,
            );
        }

        return $class;
    }

    /**
     * Return the room a schedule will occupy, refusing one that is out of circulation.
     *
     * @throws ActionError when the room is missing or unavailable
     */
    public function requireAvailableRoom(int $roomId): Room
    {
        $room = $this->rooms->findById($roomId);

        if (! $room instanceof Room) {
            throw new ActionError(
                message: 'Không tìm thấy phòng học.',
                code: AcademicError::RoomNotFound,
            );
        }

        if ($room->status !== RoomStatus::Active) {
            throw new ActionError(
                message: "Phòng học {$room->name} đang ở trạng thái {$room->status->label()}, không thể xếp lịch.",
                code: AcademicError::RoomInactive,
            );
        }

        return $room;
    }

    /**
     * Refuse a validity window that reaches outside the life of the class.
     *
     * A schedule cannot start applying before the class opens, and cannot still apply
     * after it has finished. An open-ended schedule — `end_date` NULL — needs no upper
     * check: the projection is bounded by `classes.end_at` instead, so it stops on its
     * own. A class with no `end_at` has no upper bound to compare against.
     *
     * @throws ActionError when the window falls outside the class's own dates
     */
    public function assertDatesFitClass(SchoolClass $class, string $startDate, ?string $endDate): void
    {
        $classStart = Carbon::parse($class->start_at)->toDateString();

        if ($startDate < $classStart) {
            throw new ActionError(
                message: "Lịch cố định không thể bắt đầu trước ngày khai giảng {$classStart}.",
                code: ScheduleError::StartDateBeforeClassStart,
            );
        }

        if ($endDate === null || $class->end_at === null) {
            return;
        }

        $classEnd = Carbon::parse($class->end_at)->toDateString();

        if ($endDate > $classEnd) {
            throw new ActionError(
                message: "Lịch cố định không thể kéo dài sau ngày kết thúc lớp {$classEnd}.",
                code: ScheduleError::EndDateAfterClassEnd,
            );
        }
    }
}
