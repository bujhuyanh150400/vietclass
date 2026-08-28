<?php

namespace App\Modules\Academic\Models;

use App\Modules\Identity\Models\StudentProfile;
use Carbon\CarbonInterface;
use Database\Factories\ClassEnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One period of a student's membership in a class.
 *
 * A student who leaves and returns has several rows for the same class; at most one
 * of them is active at a time.
 */
#[Fillable([
    'class_id',
    'student_id',
    'enrolled_at',
    'left_at',
    'note',
])]
final class ClassEnrollment extends Model
{
    /** @use HasFactory<ClassEnrollmentFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the enrolment model.
     */
    protected static function newFactory(): ClassEnrollmentFactory
    {
        return ClassEnrollmentFactory::new();
    }

    /**
     * Define model casts for database-backed enrolment attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enrolled_at' => 'date',
            'left_at' => 'date',
        ];
    }

    /**
     * Restrict the query to enrolments the student has not left as of the given date.
     *
     * This is the single definition of an active enrolment in the application. The
     * fork carried three competing variants of this rule; every caller here shares
     * this one, so capacity counts, duplicate checks, and rosters cannot disagree.
     *
     * @param  Builder<ClassEnrollment>  $query
     */
    #[Scope]
    protected function active(Builder $query, ?CarbonInterface $on = null): void
    {
        $date = ($on ?? now())->toDateString();

        $query->where(function (Builder $query) use ($date): void {
            $query->whereNull('left_at')->orWhere('left_at', '>', $date);
        });
    }

    /**
     * Report whether this enrolment is still running as of the given date.
     */
    public function isActive(?CarbonInterface $on = null): bool
    {
        return $this->left_at === null
            || $this->left_at->greaterThan($on ?? now());
    }

    /**
     * Return the class this enrolment belongs to.
     *
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Return the enrolled student.
     *
     * @return BelongsTo<StudentProfile, $this>
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_id', 'profile_id');
    }
}
