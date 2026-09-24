<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\ClassEnrollmentEventType;
use App\Modules\Auth\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** An immutable event describing one change to an enrollment period. */
#[Table('class_enrollment_events')]
#[Fillable([
    'class_enrollment_id',
    'related_enrollment_id',
    'actor_id',
    'event_type',
    'effective_on',
    'note',
    'metadata',
])]
final class ClassEnrollmentEvent extends Model
{
    /** Cast stored event values to their domain types. */
    protected function casts(): array
    {
        return [
            'event_type' => ClassEnrollmentEventType::class,
            'effective_on' => 'date',
            'metadata' => 'array',
        ];
    }

    /**
     * Return the enrollment period described by this event.
     *
     * @return BelongsTo<ClassEnrollment, $this>
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(ClassEnrollment::class, 'class_enrollment_id');
    }

    /**
     * Return the reciprocal period for transfer events, when present.
     *
     * @return BelongsTo<ClassEnrollment, $this>
     */
    public function relatedEnrollment(): BelongsTo
    {
        return $this->belongsTo(ClassEnrollment::class, 'related_enrollment_id');
    }

    /**
     * Return the authenticated account that caused the change, if known.
     *
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
