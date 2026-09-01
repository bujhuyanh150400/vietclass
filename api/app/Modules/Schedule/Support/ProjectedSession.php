<?php

namespace App\Modules\Schedule\Support;

use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Enums\ScheduleType;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleInstanceTeacher;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Models\ScheduleTemplateTeacher;
use Illuminate\Support\Carbon;

/**
 * One session on the calendar, whether or not a row has been written for it.
 *
 * There is a single shape for both kinds deliberately: a caller reading the calendar
 * should not have to branch on whether a lesson happens to have been materialised yet,
 * because that is a storage fact and not something the reader asked about.
 *
 * `id` is the one place the two differ, and it differs honestly: a projected session has
 * no row, so it has no identifier, and this carries `null` rather than inventing one. Its
 * identity is the `(templateId, date)` pair instead — which is exactly the pair
 * `UNIQUE (template_id, date)` is built on, so materialising it later is idempotent.
 *
 * The teacher list is read from `schedule_template_teachers` for a projected session and
 * from `schedule_instance_teachers` for a written one. Only a written one can carry a
 * substitution: a schedule says who is meant to teach, and standing in for somebody is a
 * fact about one particular day.
 */
final readonly class ProjectedSession
{
    /**
     * @param  list<array{teacher_profile_id: int, role: ScheduleTeacherRole, replaces_profile_id: int|null}>  $teachers
     */
    public function __construct(
        public ?int $id,
        public ?int $templateId,
        public ?int $classId,
        public int $subjectId,
        public string $date,
        public string $startTime,
        public string $endTime,
        public int $roomId,
        public ScheduleType $scheduleType,
        public ScheduleStatus $status,
        public bool $isCustomized,
        public ?string $note,
        public array $teachers,
    ) {}

    /**
     * Build the session a fixed schedule projects onto one date.
     *
     * Nothing is read from the database here: the schedule's own columns and its already
     * loaded teacher list carry everything a projected session reports. The status is
     * `Pending` and `isCustomized` is false because by definition nobody has touched this
     * lesson — the moment somebody does, a row exists and the other constructor applies.
     *
     * The subject comes from the class, since a schedule has no subject of its own and a
     * schedule always has a class.
     */
    public static function fromTemplate(ScheduleTemplate $template, string $date, int $subjectId): self
    {
        return new self(
            id: null,
            templateId: (int) $template->id,
            classId: (int) $template->class_id,
            subjectId: $subjectId,
            date: $date,
            startTime: (string) $template->start_time,
            endTime: (string) $template->end_time,
            roomId: (int) $template->room_id,
            scheduleType: ScheduleType::Regular,
            status: ScheduleStatus::Pending,
            isCustomized: false,
            note: null,
            teachers: array_map(
                static fn (ScheduleTemplateTeacher $row): array => [
                    'teacher_profile_id' => (int) $row->teacher_profile_id,
                    'role' => $row->role,
                    'replaces_profile_id' => null,
                ],
                $template->teachers->all(),
            ),
        );
    }

    /**
     * Build the session a written row represents.
     *
     * Every value is taken from the row rather than from the schedule it came from: once
     * a session exists it is the authority on when and where it happens and who teaches
     * it, and later phases let each of those be moved away from the schedule's values.
     */
    public static function fromInstance(ScheduleInstance $instance): self
    {
        return new self(
            id: (int) $instance->id,
            templateId: $instance->template_id === null ? null : (int) $instance->template_id,
            classId: $instance->class_id === null ? null : (int) $instance->class_id,
            subjectId: (int) $instance->subject_id,
            date: Carbon::parse($instance->date)->toDateString(),
            startTime: (string) $instance->start_time,
            endTime: (string) $instance->end_time,
            roomId: (int) $instance->room_id,
            scheduleType: $instance->schedule_type,
            status: $instance->status,
            isCustomized: (bool) $instance->is_customized,
            note: $instance->note,
            teachers: array_map(
                static fn (ScheduleInstanceTeacher $row): array => [
                    'teacher_profile_id' => (int) $row->teacher_profile_id,
                    'role' => $row->role,
                    'replaces_profile_id' => $row->replaces_profile_id === null
                        ? null
                        : (int) $row->replaces_profile_id,
                ],
                $instance->teachers->all(),
            ),
        );
    }

    /**
     * Report whether a row has been written for this session.
     *
     * Callers that must act on a stored record — anything that writes — check this
     * rather than reading `id` and guessing what a null means.
     */
    public function isMaterialised(): bool
    {
        return $this->id !== null;
    }

    /**
     * Return the key identifying which projected session this is, so a written row and
     * the projected session it replaces can be recognised as the same lesson.
     *
     * Null for a session no fixed schedule produced: a stand-alone make-up or extra
     * lesson replaces nothing, so it has no projected twin to match against.
     */
    public function projectionKey(): ?string
    {
        return $this->templateId === null
            ? null
            : $this->templateId.'|'.$this->date;
    }
}
