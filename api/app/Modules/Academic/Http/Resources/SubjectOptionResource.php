<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subject */
final class SubjectOptionResource extends JsonResource
{
    /**
     * Transform a subject into the minimal shape a combobox needs, so a picker never
     * receives the whole record.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->name,
        ];
    }
}
