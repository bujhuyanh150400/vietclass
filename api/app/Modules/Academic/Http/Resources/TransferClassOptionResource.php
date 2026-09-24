<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolClass */
final class TransferClassOptionResource extends JsonResource
{
    /** Return one transfer candidate with its details and current eligibility reason. */
    public function toArray(Request $request): array
    {
        $teacher = $this->primaryTeacher->first();

        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'grade_level' => $this->grade_level->value,
            'status' => $this->status->value,
            'subjects' => $this->subjects->map(static fn ($subject): array => [
                'id' => $subject->id,
                'name' => $subject->name,
                'is_primary' => (bool) $subject->pivot->is_primary,
            ])->all(),
            'teacher' => $teacher === null ? null : [
                'id' => $teacher->profile_id,
                'name' => $teacher->profile?->full_name,
                'status' => $teacher->status->value,
            ],
            'assistant_teachers' => $this->assistantTeachers->map(static fn ($assistant): array => [
                'id' => $assistant->profile_id,
                'name' => $assistant->profile?->full_name,
                'status' => $assistant->status->value,
            ])->all(),
            'current_student_count' => (int) $this->active_students_count,
            'max_students' => $this->max_students,
            'is_eligible' => (bool) $this->is_eligible,
            'disabled_reason' => $this->disabled_reason,
        ];
    }
}
