<?php

namespace App\Modules\FileManagement\Http\Resources;

use App\Modules\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class FileOwnerOptionResource extends JsonResource
{
    /** Transform an account into the minimal owner-picker shape. */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->profile?->full_name ?? $this->username,
        ];
    }
}
