<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subject */
final class SubjectResource extends JsonResource
{
    /**
     * Transform a subject into the public API representation.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $gradeLevels = array_map('intval', $this->grade_levels ?? []);
        sort($gradeLevels);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'grade_levels' => $gradeLevels,
            'is_active' => $this->is_active,
            'active_classes_count' => $this->whenCounted('active_classes'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
