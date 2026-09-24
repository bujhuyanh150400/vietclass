<?php

namespace App\Modules\Academic\Data;

use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Auth\Models\User;

/** One immutable event or one enrollment period with no detailed event history. */
final readonly class EnrollmentHistoryEntry
{
    /**
     * Store the already-loaded rows needed to render one timeline item without further queries.
     *
     * @param  array<string, mixed>|null  $metadata
     */
    public function __construct(
        public string $kind,
        public int $id,
        public string $effectiveOn,
        public ?string $note,
        public ClassEnrollment $enrollment,
        public ?ClassEnrollment $relatedEnrollment = null,
        public ?int $eventType = null,
        public ?array $metadata = null,
        public ?string $createdAt = null,
        public ?User $actor = null,
    ) {}
}
