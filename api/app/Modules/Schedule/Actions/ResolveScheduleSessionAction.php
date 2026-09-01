<?php

namespace App\Modules\Schedule\Actions;

use App\Core\Data\ActionResult;
use App\Core\Exceptions\ActionError;
use App\Modules\Schedule\Enums\ScheduleError;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Enums\ScheduleType;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Repositories\ScheduleInstanceRepository;
use App\Modules\Schedule\Repositories\ScheduleTemplateRepository;
use App\Modules\Schedule\Support\ProjectedSession;
use App\Modules\Schedule\Support\ScheduleProjector;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class ResolveScheduleSessionAction
{
    /**
     * Create the action with the projection it reads from and the store it writes to.
     */
    public function __construct(
        private readonly ScheduleProjector $projector,
        private readonly ScheduleTemplateRepository $templates,
        private readonly ScheduleInstanceRepository $instances,
    ) {}

    /**
     * Turn a projected session into a written one and return the row.
     *
     * This is the door every write goes through. A projected session has no identifier,
     * so it cannot be addressed by the ordinary routes; materialising it gives it one, and
     * from then on it is an ordinary record. The row copies what the fixed schedule
     * projected and moves nothing: this operation records that somebody has taken hold of
     * the lesson, not that anything about it has changed.
     *
     * The date must actually be one the fixed schedule projects onto — all four bounds of
     * the projection apply, so a date outside the schedule's window or outside the class's
     * life is refused. That is what stops a lesson being invented on a day the class does
     * not have.
     *
     * The operation is idempotent, and in two layers. A second call finds the row the
     * first one wrote and returns it. A second caller arriving in the same instant loses
     * the race on `UNIQUE (template_id, date)`, and that is answered the same way: the row
     * that won is returned rather than the constraint being reported as an error, because
     * both callers asked for the same thing and both got it.
     *
     * The conflict checker is deliberately not run. The values written are the ones an
     * already-validated fixed schedule projected onto a date it already occupied; asking
     * whether that slot is free would be asking whether the schedule clashes with itself.
     *
     * @return ActionResult<ScheduleInstance, ScheduleError>
     */
    public function handle(int $templateId, string $date, int $actorId): ActionResult
    {
        try {
            $on = Carbon::parse($date)->toDateString();
            $template = $this->templates->findById($templateId);

            if (! $template instanceof ScheduleTemplate) {
                throw new ActionError(
                    message: 'Không tìm thấy lịch cố định.',
                    code: ScheduleError::ScheduleTemplateNotFound,
                );
            }

            $written = $this->instances->findByTemplateAndDate(templateId: $templateId, date: $on)
                ?? $this->write(
                    projected: $this->requireProjectedSession(template: $template, date: $on),
                    actorId: $actorId,
                );

            return ActionResult::success($this->instances->findById((int) $written->id));
        } catch (ActionError $error) {
            return ActionResult::error(
                error: $error->code(),
                message: $error->getMessage(),
            );
        }
    }

    /**
     * Return the projected session for one fixed schedule on one date, or refuse the
     * request because the schedule does not reach that date.
     *
     * The projection itself is asked rather than the bounds being re-checked here, so this
     * cannot drift from what a reader of the calendar was shown: whatever the calendar
     * offered can be materialised, and nothing else can. The read is narrowed to the
     * schedule's own class, which is the smallest question that still answers this one.
     *
     * @throws ActionError when nothing is projected there
     */
    private function requireProjectedSession(ScheduleTemplate $template, string $date): ProjectedSession
    {
        $projection = $this->projector->project(
            from: $date,
            to: $date,
            classId: $template->class_id === null ? null : (int) $template->class_id,
        );

        foreach ($projection as $session) {
            if ($session->templateId === (int) $template->id && ! $session->isMaterialised()) {
                return $session;
            }
        }

        throw new ActionError(
            message: "Lịch cố định không có buổi học nào vào ngày {$date}.",
            code: ScheduleError::VirtualSessionNotProjected,
        );
    }

    /**
     * Write the session row and its teacher rows, together.
     *
     * Both go in one transaction because a materialised session with no main teacher is a
     * state that must not exist even for an instant — attendance, marks and fees all hang
     * off this row, and a reader arriving between the two writes would see a lesson nobody
     * teaches. The teacher list is copied from the fixed schedule with each role kept and
     * `replaces_profile_id` left null: copying a schedule is not a substitution.
     *
     * `is_customized` is true because somebody deliberately materialised this lesson, and
     * `updated_by` is written as NULL rather than left out — nobody has changed the row
     * yet, and saying so is what makes the column trustworthy elsewhere.
     *
     * @throws ActionError when the projection describes a session that may not be written
     */
    private function write(ProjectedSession $projected, int $actorId): ScheduleInstance
    {
        $this->assertClassIsStated($projected);
        $teachers = $this->teacherRowsFor($projected);

        try {
            return DB::transaction(fn (): ScheduleInstance => $this->instances->createTeachers(
                $this->instances->create([
                    'class_id' => $projected->classId,
                    'template_id' => $projected->templateId,
                    'subject_id' => $projected->subjectId,
                    'date' => $projected->date,
                    'start_time' => $projected->startTime,
                    'end_time' => $projected->endTime,
                    'room_id' => $projected->roomId,
                    'schedule_type' => ScheduleType::Regular,
                    'status' => ScheduleStatus::Pending,
                    'is_customized' => true,
                    'note' => null,
                    'created_by' => $actorId,
                    'updated_by' => null,
                ]),
                $teachers,
            ));
        } catch (UniqueConstraintViolationException $collision) {
            // Somebody materialised the same lesson between the lookup above and this
            // insert. The unique index is the arbiter and it has already decided; the
            // caller wanted this lesson to have a row and it does. Only this one
            // constraint is read this way, and only to return the winning row — if the row
            // is somehow gone, the collision was about something else and must not be
            // swallowed.
            $winner = $this->instances->findByTemplateAndDate(
                templateId: (int) $projected->templateId,
                date: $projected->date,
            );

            if (! $winner instanceof ScheduleInstance) {
                throw $collision;
            }

            return $winner;
        }
    }

    /**
     * Refuse a session that names a fixed schedule but no class.
     *
     * This was a CHECK constraint in an earlier draft of the schema and is now an
     * application rule, so it has to be stated in every path that writes a session or it
     * is not stated anywhere. A fixed schedule always belongs to a class, so a projection
     * that lost the class on the way here is a defect rather than bad input — and it is
     * exactly the kind of defect a silently nullable column lets through.
     *
     * @throws ActionError when the class is missing
     */
    private function assertClassIsStated(ProjectedSession $projected): void
    {
        if ($projected->templateId !== null && $projected->classId === null) {
            throw new ActionError(
                message: 'Buổi học sinh từ lịch cố định phải thuộc một lớp.',
                code: ScheduleError::SessionClassRequired,
            );
        }
    }

    /**
     * Return the teacher rows to write for the session, refusing a schedule that has no
     * main teacher to copy.
     *
     * The list comes from the fixed schedule and the roster rules already applied to it,
     * so this check should never fire through the module's own write paths. It is here
     * because the invariant being protected is about the session: whatever the state of
     * the schedule, a lesson without a main teacher must not be written.
     *
     * @return list<array{teacher_profile_id: int, role: ScheduleTeacherRole, replaces_profile_id: null}>
     *
     * @throws ActionError when the fixed schedule names no main teacher
     */
    private function teacherRowsFor(ProjectedSession $projected): array
    {
        $rows = array_map(
            static fn (array $teacher): array => [
                'teacher_profile_id' => $teacher['teacher_profile_id'],
                'role' => $teacher['role'],
                'replaces_profile_id' => null,
            ],
            $projected->teachers,
        );

        $hasMainTeacher = array_filter(
            $rows,
            static fn (array $row): bool => $row['role'] === ScheduleTeacherRole::MainTeacher,
        ) !== [];

        if (! $hasMainTeacher) {
            throw new ActionError(
                message: 'Lịch cố định phải có một giáo viên chính trước khi vật thể hoá buổi học.',
                code: ScheduleError::MainTeacherRequired,
            );
        }

        return $rows;
    }
}
