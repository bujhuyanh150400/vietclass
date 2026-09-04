<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\TeacherProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TeacherProfile */
final class TeacherResource extends JsonResource
{
    /**
     * Transform a teacher profile into the public API representation. The account is
     * reported as its login name and locked state only; no credential is ever included.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->profile;

        return [
            'id' => $this->profile_id,
            'profile_id' => $this->profile_id,
            'user_id' => $profile->user_id,
            'full_name' => $profile->full_name,
            'phone' => $profile->phone,
            'email' => $profile->email,
            'gender' => $profile->gender->value,
            'address' => $profile->address,
            'status' => $this->status->value,
            'color_identification' => $this->color_identification,
            'joined_at' => $this->joined_at?->toDateString(),
            'username' => $profile->user?->username,
            'is_account_active' => $profile->user?->is_active,
            'avatar' => $profile instanceof Profile && $profile->avatar_config !== null
                ? AvatarResource::make($profile)->resolve($request)
                : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
