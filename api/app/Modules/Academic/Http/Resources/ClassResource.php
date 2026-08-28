<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolClass */
final class ClassResource extends JsonResource
{
    /**
     * Transform a class into the public API representation, including the headcount
     * that capacity is measured against.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'subject_id' => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn (): ?string => $this->subject?->name),
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->whenLoaded('teacher', fn (): ?string => $this->teacher?->profile?->full_name),
            'grade_level' => $this->grade_level->value,
            'max_students' => $this->max_students,
            'active_students_count' => $this->whenCounted('active_students'),
            'status' => $this->status->value,
            'start_at' => $this->start_at?->toDateString(),
            'end_at' => $this->end_at?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
