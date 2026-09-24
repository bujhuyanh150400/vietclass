<?php

namespace App\Modules\Academic\Http\Resources;

use App\Modules\Academic\Data\EnrollmentHistoryEntry;
use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin EnrollmentHistoryEntry */
final class EnrollmentHistoryEntryResource extends JsonResource
{
    /** Transform an event or a pre-event period into its explicit timeline shape. */
    public function toArray(Request $request): array
    {
        if ($this->kind === 'legacy_enrollment') {
            return [
                'kind' => $this->kind,
                'id' => $this->id,
                'effective_on' => $this->effectiveOn,
                'note' => $this->note,
                'enrollment' => [
                    ...$this->period($this->enrollment),
                    'enrolled_at' => $this->enrollment->enrolled_at?->toDateString(),
                    'left_at' => $this->enrollment->left_at?->toDateString(),
                    'note' => $this->enrollment->note,
                ],
                'actor' => null,
            ];
        }

        return [
            'kind' => $this->kind,
            'id' => $this->id,
            'event_type' => $this->eventType,
            'effective_on' => $this->effectiveOn,
            'note' => $this->note,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->createdAt,
            'enrollment' => $this->period($this->enrollment),
            'related_enrollment' => $this->relatedEnrollment === null
                ? null
                : $this->period($this->relatedEnrollment),
            'actor' => $this->actor === null ? null : [
                'id' => $this->actor->id,
                'username' => $this->actor->username,
            ],
        ];
    }

    /** Return an enrollment ID and its immutable class/subject snapshot projection. */
    private function period(ClassEnrollment $enrollment): array
    {
        return [
            'id' => $enrollment->id,
            'class' => $this->classSummary($enrollment->schoolClass),
        ];
    }

    /** Return a class's current identity and complete subject set. */
    private function classSummary(SchoolClass $class): array
    {
        return [
            'id' => $class->id,
            'code' => $class->code,
            'name' => $class->name,
            'subjects' => $class->subjects->map(static fn ($subject): array => [
                'id' => $subject->id,
                'name' => $subject->name,
            ])->all(),
        ];
    }
}
