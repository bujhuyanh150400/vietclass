<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Profile */
final class GuardianOptionResource extends JsonResource
{
    /**
     * Transform a guardian into the shape the picker needs to tell two of them apart.
     *
     * Unlike the teacher combobox, this carries the phone number: two guardians
     * routinely share a name, and the number is what a caller recognises the right
     * one by. The endpoint behind it is administrator-only, and no other contact
     * detail is included.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->full_name,
            'phone' => $this->phone,
        ];
    }
}
