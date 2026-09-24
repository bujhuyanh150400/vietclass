<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolClass */
final class ClassResource extends JsonResource
{
    /**
     * Transform a class into its compatible public fields, full teaching team, and
     * headcount that capacity is measured against.
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
            'subject_name' => $this->whenLoaded('primarySubject', fn (): ?string => $this->subject?->name),
            'subjects' => $this->whenLoaded('subjects', fn (): array => $this->subjects->map(fn ($subject): array => [
                'id' => $subject->id,
                'name' => $subject->name,
                'is_active' => $subject->is_active,
                'grade_levels' => $subject->grade_levels,
                'is_primary' => (bool) $subject->pivot->is_primary,
            ])->all()),
            'teacher_id' => $this->teacher_id,
            'teacher_name' => $this->whenLoaded('primaryTeacher', fn (): ?string => $this->teacher?->profile?->full_name),
            'teacher_status' => $this->whenLoaded('primaryTeacher', fn (): ?int => $this->teacher?->status->value),
            'assistant_teachers' => $this->whenLoaded('assistantTeachers', fn (): array => $this->assistantTeachers->map(fn ($assistant): array => [
                'id' => $assistant->profile_id,
                'name' => $assistant->profile?->full_name,
                'status' => $assistant->status->value,
            ])->all()),
            'grade_level' => $this->grade_level->value,
            'max_students' => $this->max_students,
            'active_students_count' => $this->whenCounted('active_students'),
            'past_enrollments_count' => $this->whenCounted('past_enrollments'),
            'status' => $this->status->value,
            'start_at' => $this->start_at?->toDateString(),
            'end_at' => $this->end_at?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
