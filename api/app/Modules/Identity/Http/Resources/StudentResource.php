<?php

namespace App\Modules\Identity\Http\Resources;

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

        return [
            'id' => $this->profile_id,
            'user_id' => $this->profile->user_id,
            'full_name' => $this->profile->full_name,
            'phone' => $this->profile->phone,
            'dob' => $this->profile->dob?->toDateString(),
            'gender' => $this->profile->gender->value,
            'grade_level' => $this->grade_level->value,
            'guardian_name' => $guardianLink?->guardian->full_name,
            'guardian_phone' => $guardianLink?->guardian->phone,
            'guardian_gender' => $guardianLink?->guardian->gender->value,
            'guardian_relationship' => $guardianLink?->relationship->value,
            'address' => $this->profile->address,
            'note' => $this->profile->note,
            'status' => $this->status->value,
            'username' => $this->profile->user?->username,
            'is_account_active' => $this->profile->user?->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
