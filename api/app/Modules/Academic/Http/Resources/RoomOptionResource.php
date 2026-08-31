<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Room */
final class RoomOptionResource extends JsonResource
{
    /**
     * Transform a room into the minimal shape a room picker needs.
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
