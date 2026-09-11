<?php

namespace App\Modules\Identity\Http\Resources;

use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentGuardian;
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
            'guardians' => $this->guardianSummaries(),
            'active_enrollments' => $this->activeEnrollmentSummaries(),
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

    /**
     * Report every guardian recorded for this student, main contact first.
     *
     * The order is part of the contract rather than a detail: the list shows only the
     * first couple of guardians and counts the rest behind a "+N", so the main
     * contact has to be among the ones on screen. An empty list is returned as an
     * empty array, never as null, so a reader never has to distinguish "no guardian"
     * from "not reported".
     *
     * @return list<array<string, mixed>>
     */
    private function guardianSummaries(): array
    {
        return $this->guardianLinks
            ->sortByDesc(fn (StudentGuardian $link): bool => (bool) $link->is_primary)
            ->map(fn (StudentGuardian $link): array => [
                'profile_id' => $link->guardian_profile_id,
                'full_name' => $link->guardian->full_name,
                'phone' => $link->guardian->phone,
                'relationship' => $link->relationship->value,
                'is_primary' => (bool) $link->is_primary,
            ])
            ->values()
            ->all();
    }

    /**
     * Report the classes this student is still attending, naming each one by the code
     * a reader recognises it by and the subject it teaches.
     *
     * Only running enrolments appear. A class the student has left is absent rather
     * than present and flagged, so nothing downstream has to re-implement the
     * "still attending" rule to filter it out.
     *
     * @return list<array<string, mixed>>
     */
    private function activeEnrollmentSummaries(): array
    {
        return $this->activeEnrollments
            ->map(fn (ClassEnrollment $enrollment): array => [
                'class_id' => $enrollment->class_id,
                'code' => $enrollment->schoolClass->code,
                'subject_name' => $enrollment->schoolClass->subject?->name,
            ])
            ->values()
            ->all();
    }
}
