<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudentProfile */
final class StudentResource extends JsonResource
{
    /**
     * Transform a student profile into the public API representation. The account is
     * reported as its login name and locked state only; no credential is ever included.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $guardianLink = $this->primaryGuardian;
        $profile = $this->profile;

        return [
            'id' => $this->profile_id,
            'profile_id' => $this->profile_id,
            'user_id' => $profile->user_id,
            'full_name' => $profile->full_name,
            'phone' => $profile->phone,
            'dob' => $profile->dob?->toDateString(),
            'gender' => $profile->gender->value,
            'grade_level' => $this->grade_level->value,
            'guardian_name' => $guardianLink?->guardian->full_name,
            'guardian_phone' => $guardianLink?->guardian->phone,
            'guardian_gender' => $guardianLink?->guardian->gender->value,
            'guardian_relationship' => $guardianLink?->relationship->value,
            'address' => $profile->address,
            'note' => $profile->note,
            'status' => $this->status->value,
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
