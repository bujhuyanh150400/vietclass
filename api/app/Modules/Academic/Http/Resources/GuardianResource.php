<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\StudentGuardian;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Profile */
final class GuardianResource extends JsonResource
{
    /** Transform a guardian profile and its complete linked-student roster. */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'gender' => $this->gender->value,
            'address' => $this->address,
            'note' => $this->note,
            'students' => $this->guardianLinks
                ->sort(function (StudentGuardian $left, StudentGuardian $right): int {
                    if ($left->is_primary !== $right->is_primary) {
                        return $left->is_primary ? -1 : 1;
                    }

                    $nameOrder = strcasecmp(
                        $left->studentProfile->profile->full_name,
                        $right->studentProfile->profile->full_name,
                    );

                    return $nameOrder !== 0
                        ? $nameOrder
                        : $left->student_profile_id <=> $right->student_profile_id;
                })
                ->map(fn (StudentGuardian $link): array => [
                    'id' => $link->student_profile_id,
                    'full_name' => $link->studentProfile->profile->full_name,
                    'grade_level' => $link->studentProfile->grade_level->value,
                    'relationship' => $link->relationship->value,
                    'is_primary' => (bool) $link->is_primary,
                ])
                ->values()
                ->all(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
