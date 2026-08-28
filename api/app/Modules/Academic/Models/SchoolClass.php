<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Models\TeacherProfile;
use Database\Factories\SchoolClassFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A class of students taught one subject by one teacher.
 *
 * Named SchoolClass because `Class` is a reserved word in PHP; the table keeps the
 * conventional plural name.
 */
#[Table('classes')]
#[Fillable([
    'code',
    'name',
    'subject_id',
    'teacher_id',
    'grade_level',
    'max_students',
    'status',
    'start_at',
    'end_at',
])]
final class SchoolClass extends Model
{
    /** @use HasFactory<SchoolClassFactory> */
    use HasFactory;

    /** @var array<string, int> */
    protected $attributes = [
        'max_students' => 0,
        'status' => ClassStatus::Active->value,
    ];

    /**
     * Create the dedicated factory for the class model.
     */
    protected static function newFactory(): SchoolClassFactory
    {
        return SchoolClassFactory::new();
    }

    /**
     * Define model casts for database-backed class attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'grade_level' => GradeLevel::class,
            'status' => ClassStatus::class,
            'max_students' => 'integer',
            'start_at' => 'date',
            'end_at' => 'date',
        ];
    }

    /**
     * Return the subject this class teaches.
     *
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Return the teacher responsible for this class.
     *
     * The key stored here is the shared `profile_id`, so the foreign key can only
     * resolve to somebody who actually holds a teaching role.
     *
     * @return BelongsTo<TeacherProfile, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_id', 'profile_id');
    }

    /**
     * Return every enrolment ever recorded for this class, including the ones a
     * student left, because that history is what re-enrolment preserves.
     *
     * @return HasMany<ClassEnrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class, 'class_id');
    }
}
