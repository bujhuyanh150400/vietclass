<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudentProfile */
final class EnrollmentStudentOptionResource extends JsonResource
{
    /** Return only the student data needed to decide and describe enrolment choices. */
    public function toArray(Request $request): array
    {
        $profile = $this->profile;
        $disabledReason = $this->getAttribute('disabled_reason');

        return [
            'id' => $this->profile_id,
            'profile_id' => $this->profile_id,
            'full_name' => $profile->full_name,
            'phone' => $profile->phone,
            'grade_level' => $this->grade_level->value,
            'status' => $this->status->value,
            'is_account_active' => $profile->user?->is_active,
            'active_enrollments' => $this->activeEnrollments->map(static fn (ClassEnrollment $enrollment): array => [
                'class_id' => $enrollment->class_id,
                'name' => $enrollment->schoolClass->name,
                'code' => $enrollment->schoolClass->code,
                'subjects' => $enrollment->schoolClass->subjects->map(static fn ($subject): array => [
                    'id' => $subject->id,
                    'name' => $subject->name,
                ])->all(),
            ])->values()->all(),
            'is_eligible' => $disabledReason === null,
            'disabled_reason' => $disabledReason,
        ];
    }
}
