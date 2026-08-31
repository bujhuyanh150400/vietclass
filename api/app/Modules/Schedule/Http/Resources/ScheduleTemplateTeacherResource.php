<?php

namespace App\Modules\Schedule\Http\Resources;

use App\Modules\Schedule\Models\ScheduleTemplateTeacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ScheduleTemplateTeacher */
final class ScheduleTemplateTeacherResource extends JsonResource
{
    /**
     * Transform one teacher's assignment to a fixed schedule into its public shape.
     *
     * The role travels with the person rather than being implied by which list they
     * appear in, so a caller reading the flat teacher list still knows who leads it.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'teacher_profile_id' => $this->teacher_profile_id,
            'teacher_name' => $this->whenLoaded('teacher', fn (): ?string => $this->teacher?->profile?->full_name),
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
        ];
    }
}
