<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\Profile;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\TeacherProfile;
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
        $classes = $this->relationLoaded('classes') ? $this->classes : collect();
        $assistantClasses = $this->relationLoaded('assistantClasses') ? $this->assistantClasses : collect();
        // Keep the class summary shape identical for lead and assistant assignments.
        $classPayload = static function (SchoolClass $class): array {
            $subject = $class->relationLoaded('primarySubject') ? $class->subject : null;

            return [
                'id' => $class->id,
                'code' => $class->code,
                'name' => $class->name,
                'subject_id' => $subject?->id,
                'subject_name' => $subject?->name,
                'status' => $class->status->value,
            ];
        };
        $subjects = $classes
            ->flatMap(static fn (SchoolClass $class) => $class->relationLoaded('subjects') ? $class->subjects : collect())
            ->unique('id')
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->map(static fn ($subject): array => [
                'id' => $subject->id,
                'name' => $subject->name,
            ])
            ->all();

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
            'subjects' => $subjects,
            'classes' => $classes->map($classPayload)->values()->all(),
            'assistant_classes' => $assistantClasses->map($classPayload)->values()->all(),
            $this->mergeWhen($this->relationLoaded('endedClasses'), [
                'ended_classes' => $this->relationLoaded('endedClasses') ? $this->endedClasses->map($classPayload)->values()->all() : [],
                'ended_assistant_classes' => $this->relationLoaded('endedAssistantClasses') ? $this->endedAssistantClasses->map($classPayload)->values()->all() : [],
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
