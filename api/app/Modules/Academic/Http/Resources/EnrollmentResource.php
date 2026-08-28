<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\ClassEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ClassEnrollment */
final class EnrollmentResource extends JsonResource
{
    /**
     * Transform one membership period into the public API representation.
     *
     * `is_active` is computed rather than stored, because whether a period is running
     * depends on today's date as well as the leave date.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'student_id' => $this->student_id,
            'student_name' => $this->whenLoaded('student', fn (): ?string => $this->student?->profile?->full_name),
            'enrolled_at' => $this->enrolled_at?->toDateString(),
            'left_at' => $this->left_at?->toDateString(),
            'is_active' => $this->isActive(),
            'note' => $this->note,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
