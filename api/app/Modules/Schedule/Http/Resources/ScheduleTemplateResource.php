<?php

namespace App\Modules\Schedule\Http\Resources;

use App\Modules\Schedule\Models\ScheduleTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ScheduleTemplate */
final class ScheduleTemplateResource extends JsonResource
{
    /**
     * Transform a fixed schedule into the public API representation.
     *
     * The teacher list is reported three ways on purpose: `teachers` is the whole list
     * with each person's role, and `main_teacher` and `assistant_teachers` split it the
     * way a reader thinks about it. Both splits come from the model's own relations, so
     * what a role value means is decided in one place rather than again here.
     *
     * There is no "inherited from the class" state to represent — teachers are always
     * stated on the schedule — and `is_closed` reports the one derived fact a reader
     * would otherwise have to work out from `end_date` themselves.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'day_of_week' => $this->day_of_week->value,
            'day_of_week_label' => $this->day_of_week->label(),
            'start_time' => $this->hourAndMinute($this->start_time),
            'end_time' => $this->hourAndMinute($this->end_time),
            'room_id' => $this->room_id,
            'room_name' => $this->whenLoaded('room', fn (): ?string => $this->room?->name),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'is_closed' => $this->end_date !== null,
            'main_teacher' => $this->whenLoaded(
                'mainTeacher',
                fn (): ?array => $this->mainTeacher === null
                    ? null
                    : ScheduleTemplateTeacherResource::make($this->mainTeacher)->resolve($request),
            ),
            'assistant_teachers' => $this->whenLoaded(
                'assistantTeachers',
                fn (): array => ScheduleTemplateTeacherResource::collection($this->assistantTeachers)
                    ->resolve($request),
            ),
            'teachers' => $this->whenLoaded(
                'teachers',
                fn (): array => ScheduleTemplateTeacherResource::collection($this->teachers)->resolve($request),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Trim a stored `HH:MM:SS` time down to the `HH:MM` a reader is shown, because a
     * weekly slot is never scheduled to the second.
     */
    private function hourAndMinute(mixed $time): string
    {
        return substr((string) $time, 0, 5);
    }
}
