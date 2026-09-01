<?php

namespace App\Modules\Schedule\Http\Resources;

use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Support\ProjectedSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProjectedSession */
final class ScheduleSessionResource extends JsonResource
{
    /**
     * Transform one session on the calendar into the public API representation.
     *
     * A projected session and a written one are reported through the same shape, because
     * whether a lesson has a row behind it yet is a storage fact and not something the
     * reader asked about. `id` is the one field that differs, and it differs honestly: a
     * projected session carries `null` rather than a fabricated identifier, and its
     * identity is the `template_id` and `date` pair reported alongside — which is the pair
     * the materialise endpoint takes, so a caller holding this payload can always act on
     * the lesson.
     *
     * The teacher list is read from whichever side owns it — the fixed schedule for a
     * projected session, the session's own rows for a written one — but the value object
     * has already settled that, so nothing here needs to know which kind it holds. Only a
     * written session can report a `replaces_profile_id`: a schedule says who is meant to
     * teach, while standing in for somebody is a fact about one particular day.
     *
     * Every identifier is reported beside the name it stands for, so a calendar cell can
     * be drawn from this payload alone. The reader is not asked to resolve them: the
     * `options` endpoints list only what may still be chosen — active rooms, running
     * classes, unlocked subjects — while a calendar shows lessons in rooms under
     * maintenance and lessons of classes that have finished, and those would be left
     * nameless. `class_code` travels with `class_name` because class names repeat across
     * grades and codes do not.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_id' => $this->templateId,
            'class_id' => $this->classId,
            'class_code' => $this->classCode,
            'class_name' => $this->className,
            'subject_id' => $this->subjectId,
            'subject_name' => $this->subjectName,
            'date' => $this->date,
            'start_time' => $this->hourAndMinute($this->startTime),
            'end_time' => $this->hourAndMinute($this->endTime),
            'room_id' => $this->roomId,
            'room_name' => $this->roomName,
            'schedule_type' => $this->scheduleType->value,
            'schedule_type_label' => $this->scheduleType->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_customized' => $this->isCustomized,
            'note' => $this->note,
            'teachers' => $this->teacherList(),
        ];
    }

    /**
     * Return the people teaching this session, each with the role they hold on it.
     *
     * The role travels with the person rather than being implied by which list they
     * appear in, matching how a fixed schedule reports its own list, so a caller reading
     * the flat list still knows who leads it. So does the name, for the same reason every
     * other name is reported here: a calendar showing `#7` where a teacher should be is a
     * calendar nobody can read.
     *
     * `replaces_profile_id` is still an identifier alone. Nothing in this phase can write
     * a substitution, so there is never a name there to report.
     *
     * @return list<array<string, mixed>>
     */
    private function teacherList(): array
    {
        /** @var list<array{teacher_profile_id: int, teacher_name: string, role: ScheduleTeacherRole, replaces_profile_id: int|null}> $teachers */
        $teachers = $this->teachers;

        return array_map(
            static fn (array $teacher): array => [
                'teacher_profile_id' => $teacher['teacher_profile_id'],
                'teacher_name' => $teacher['teacher_name'],
                'role' => $teacher['role']->value,
                'role_label' => $teacher['role']->label(),
                'replaces_profile_id' => $teacher['replaces_profile_id'],
            ],
            $teachers,
        );
    }

    /**
     * Trim a stored `HH:MM:SS` time down to the `HH:MM` a reader is shown, because a
     * lesson is never scheduled to the second.
     */
    private function hourAndMinute(string $time): string
    {
        return substr($time, 0, 5);
    }
}
