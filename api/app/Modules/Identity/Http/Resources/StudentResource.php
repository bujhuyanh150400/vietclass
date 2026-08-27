<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Student */
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
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'dob' => $this->dob?->toDateString(),
            'gender' => $this->gender->value,
            'grade_level' => $this->grade_level->value,
            'parent_name' => $this->parent_name,
            'parent_phone' => $this->parent_phone,
            'address' => $this->address,
            'note' => $this->note,
            'status' => $this->status->value,
            'username' => $this->whenLoaded('user', fn (): string => $this->user->username),
            'is_account_active' => $this->whenLoaded('user', fn (): bool => $this->user->is_active),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
