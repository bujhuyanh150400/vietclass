<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Teacher */
final class TeacherOptionResource extends JsonResource
{
    /**
     * Transform a teacher into the minimal shape a combobox needs, so a picker never
     * receives contact or payment details.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->full_name,
        ];
    }
}
