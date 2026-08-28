<?php

namespace App\Modules\Identity\Http\Resources;

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
        return [
            'id' => $this->profile_id,
            'user_id' => $this->profile->user_id,
            'full_name' => $this->profile->full_name,
            'phone' => $this->profile->phone,
            'email' => $this->profile->email,
            'gender' => $this->profile->gender->value,
            'address' => $this->profile->address,
            'status' => $this->status->value,
            'color_identification' => $this->color_identification,
            'joined_at' => $this->joined_at?->toDateString(),
            'username' => $this->profile->user?->username,
            'is_account_active' => $this->profile->user?->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
