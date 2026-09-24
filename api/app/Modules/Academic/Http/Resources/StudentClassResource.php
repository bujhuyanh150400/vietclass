<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolClass */
final class StudentClassResource extends JsonResource
{
    /** Transform one distinct class the student currently attends or attended before. */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'grade_level' => $this->grade_level->value,
            'status' => $this->status->value,
            'is_current' => (bool) $this->is_current,
            'enrollment_periods_count' => (int) $this->enrollment_periods_count,
            'subjects' => $this->whenLoaded('subjects', fn (): array => $this->subjects->map(static fn ($subject): array => [
                'id' => $subject->id,
                'name' => $subject->name,
            ])->all()),
        ];
    }
}
