<?php

namespace App\Modules\Schedule\Support;

use App\Core\Exceptions\ActionError;
use App\Modules\Academic\Enums\AcademicError;
use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Identity\Repositories\TeacherRepository;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;

/**
 * Turns a submitted teacher list into the rows a fixed schedule may store, refusing
 * every list the schedule's two unique indexes would refuse anyway.
 *
 * The checks happen here rather than being left to the database on purpose: a unique
 * violation surfaces as an unexpected system error with a constraint name in it, which
 * says nothing a caller can act on. Validating first turns both index rules — one
 * person at most once, exactly one main teacher — into business errors carrying a
 * Vietnamese message. The indexes stay as the last line of defence for a concurrent
 * write that slips between this check and the insert.
 *
 * Every write path that names teachers goes through this class, so creating a
 * schedule, revising one, and replacing its teacher list cannot drift apart on what a
 * valid list is.
 */
final class ScheduleTeacherRoster
{
    /**
     * Create the roster with the store it verifies each named teacher against.
     */
    public function __construct(
        private readonly TeacherRepository $teachers,
    ) {}

    /**
     * Return the teacher rows to store for a fixed schedule, or throw when the
     * submitted list breaks a rule.
     *
     * A list is valid when it names exactly one main teacher, names nobody twice, and
     * every person on it is still employed. Assistants are held to the employment rule
     * as strictly as the main teacher: assigning work to somebody who has left is the
     * same mistake whichever role it is given under.
     *
     * @param  list<array{teacher_profile_id: int|string, role: int|string|ScheduleTeacherRole}>  $teachers
     * @return list<array{teacher_profile_id: int, role: ScheduleTeacherRole}>
     *
     * @throws ActionError when the list cannot be stored
     */
    public function resolve(array $teachers): array
    {
        $rows = array_map(
            static fn (array $teacher): array => [
                'teacher_profile_id' => (int) $teacher['teacher_profile_id'],
                'role' => $teacher['role'] instanceof ScheduleTeacherRole
                    ? $teacher['role']
                    : ScheduleTeacherRole::from((int) $teacher['role']),
            ],
            array_values($teachers),
        );

        $this->assertNobodyIsNamedTwice($rows);
        $this->assertExactlyOneMainTeacher($rows);

        foreach ($rows as $row) {
            $this->assertTeacherIsEmployed($row['teacher_profile_id']);
        }

        return $rows;
    }

    /**
     * Refuse a list that names the same person more than once, whatever roles the
     * repeated entries claim.
     *
     * @param  list<array{teacher_profile_id: int, role: ScheduleTeacherRole}>  $rows
     */
    private function assertNobodyIsNamedTwice(array $rows): void
    {
        $ids = array_column($rows, 'teacher_profile_id');

        if (count($ids) !== count(array_unique($ids))) {
            throw new ActionError(
                message: 'Một giáo viên chỉ được xuất hiện một lần trong cùng một lịch cố định.',
                code: ScheduleError::DuplicateTeacher,
            );
        }
    }

    /**
     * Refuse a list that has no main teacher or more than one.
     *
     * An empty list falls into the first case, which is the honest reading: a schedule
     * nobody teaches is exactly a schedule with no main teacher.
     *
     * @param  list<array{teacher_profile_id: int, role: ScheduleTeacherRole}>  $rows
     */
    private function assertExactlyOneMainTeacher(array $rows): void
    {
        $mainTeachers = count(array_filter(
            $rows,
            static fn (array $row): bool => $row['role'] === ScheduleTeacherRole::MainTeacher,
        ));

        if ($mainTeachers === 0) {
            throw new ActionError(
                message: 'Lịch cố định phải có một giáo viên chính.',
                code: ScheduleError::MainTeacherRequired,
            );
        }

        if ($mainTeachers > 1) {
            throw new ActionError(
                message: 'Lịch cố định chỉ được có một giáo viên chính.',
                code: ScheduleError::MultipleMainTeachers,
            );
        }
    }

    /**
     * Refuse a teacher who does not exist or has left, naming them so the caller knows
     * which entry to correct.
     */
    private function assertTeacherIsEmployed(int $teacherProfileId): void
    {
        $teacher = $this->teachers->findById($teacherProfileId);

        if (! $teacher instanceof TeacherProfile) {
            throw new ActionError(
                message: 'Không tìm thấy giáo viên.',
                code: AcademicError::TeacherNotFound,
            );
        }

        if ($teacher->status !== TeacherStatus::Active) {
            $fullName = $teacher->profile?->full_name ?? 'này';

            throw new ActionError(
                message: "Giáo viên {$fullName} không còn làm việc, không thể xếp vào lịch.",
                code: AcademicError::TeacherInactive,
            );
        }
    }
}
