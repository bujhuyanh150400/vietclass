<?php

namespace App\Modules\Auth\Http\Resources;

use App\Modules\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class CurrentUserResource extends JsonResource
{
    /**
     * Transform the authenticated user into the public API representation.
     *
     * @return array<string, int|string|bool>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'role' => $this->role->value,
            'is_active' => $this->is_active,
        ];
    }
}
