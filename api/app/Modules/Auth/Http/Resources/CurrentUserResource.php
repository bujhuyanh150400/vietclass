<?php

namespace App\Modules\Auth\Http\Resources;

use App\Modules\Identity\Http\Resources\AvatarResource;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class CurrentUserResource extends JsonResource
{
    /**
     * Transform the authenticated user into the public API representation.
     *
     * @return array<string, int|string|bool|array|null>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->resource->relationLoaded('profile')
            ? $this->resource->getRelation('profile')
            : null;

        return [
            'id' => $this->id,
            'username' => $this->username,
            'role' => $this->role->value,
            'is_active' => $this->is_active,
            'profile_id' => $profile instanceof Profile ? $profile->id : null,
            'avatar' => $profile instanceof Profile && $profile->avatar_config !== null
                ? AvatarResource::make($profile)->resolve($request)
                : null,
        ];
    }
}
