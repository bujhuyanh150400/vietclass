<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Identity\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Teacher */
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
            'id' => $this->id,
            'user_id' => $this->user_id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'bank_bin' => $this->bank_bin,
            'bank_name' => $this->bank_name,
            'bank_account_number' => $this->bank_account_number,
            'bank_account_holder' => $this->bank_account_holder,
            'status' => $this->status->value,
            'color' => $this->color,
            'joined_at' => $this->joined_at?->toDateString(),
            'username' => $this->whenLoaded('user', fn (): string => $this->user->username),
            'is_account_active' => $this->whenLoaded('user', fn (): bool => $this->user->is_active),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
