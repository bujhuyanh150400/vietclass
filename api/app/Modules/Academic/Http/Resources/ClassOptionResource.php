<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolClass */
final class ClassOptionResource extends JsonResource
{
    /**
     * Transform a class into the minimal shape a combobox needs. The label carries the
     * code as well as the name, because class names repeat across grades while codes
     * do not.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => "{$this->name} ({$this->code})",
        ];
    }
}
