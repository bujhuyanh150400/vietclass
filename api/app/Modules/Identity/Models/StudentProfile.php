<?php

namespace App\Modules\Identity\Models;

use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use Database\Factories\StudentProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'profile_id',
    'grade_level',
    'status',
])]
final class StudentProfile extends Model
{
    /** @use HasFactory<StudentProfileFactory> */
    use HasFactory;

    protected $table = 'student_profiles';

    /** The key is shared with the profile row rather than generated here. */
    protected $primaryKey = 'profile_id';

    public $incrementing = false;

    protected $keyType = 'int';

    /** @var array<string, int> */
    protected $attributes = [
        'status' => StudentStatus::Studying->value,
    ];

    /**
     * Create the dedicated factory for the student profile model.
     */
    protected static function newFactory(): StudentProfileFactory
    {
        return StudentProfileFactory::new();
    }

    /**
     * Define model casts for database-backed student attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'grade_level' => GradeLevel::class,
            'status' => StudentStatus::class,
        ];
    }

    /**
     * Return the shared profile this student role belongs to.
     *
     * @return BelongsTo<Profile, $this>
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'profile_id');
    }

    /**
     * Return every guardian link recorded for this student.
     *
     * @return HasMany<StudentGuardian, $this>
     */
    public function guardianLinks(): HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'student_profile_id', 'profile_id');
    }

    /**
     * Return the single guardian link marked as the main contact.
     *
     * @return HasOne<StudentGuardian, $this>
     */
    public function primaryGuardian(): HasOne
    {
        return $this->hasOne(StudentGuardian::class, 'student_profile_id', 'profile_id')
            ->where('is_primary', true);
    }

    /**
     * Return the class memberships this student is still attending, longest-running
     * first so the order a reader sees does not shuffle between requests.
     *
     * This is the one place Identity reaches into Academic, inverting the direction
     * every other reference between the two runs in. It is accepted because the
     * student list has to name the classes a student attends, and the alternative —
     * a courier type passed between the modules — would carry two fields and nothing
     * else. The rule for "still attending" is deliberately not restated here: it
     * comes from `ClassEnrollment::active()`, the single definition that class
     * rosters and capacity counts already share.
     *
     * @return HasMany<ClassEnrollment, $this>
     */
    public function activeEnrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class, 'student_id', 'profile_id')
            ->active()
            ->orderBy('enrolled_at')
            ->orderBy('id');
    }
}
