<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\GradeLevel;
use Database\Factories\SchoolClassFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A class teaching one or more subjects with one lead and optional assistants.
 *
 * Named SchoolClass because `Class` is a reserved word in PHP; the table keeps the
 * conventional plural name.
 */
#[Table('classes')]
#[Fillable([
    'code',
    'name',
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
     * Expose the representative subject ID for legacy clients from the normalized relation.
     *
     * @return Attribute<int|null, never>
     */
    protected function subjectId(): Attribute
    {
        return Attribute::get(fn (): ?int => $this->subject?->id);
    }

    /**
     * Expose the lead teacher ID for legacy clients from the normalized relation.
     *
     * @return Attribute<int|null, never>
     */
    protected function teacherId(): Attribute
    {
        return Attribute::get(fn (): ?int => $this->teacher?->profile_id);
    }

    /**
     * Resolve the representative subject while retaining the legacy singular property.
     *
     * @return Attribute<Subject|null, never>
     */
    protected function subject(): Attribute
    {
        return Attribute::get(fn (): ?Subject => $this->primarySubject->first());
    }

    /**
     * Resolve the lead teacher while retaining the legacy singular property.
     *
     * @return Attribute<TeacherProfile|null, never>
     */
    protected function teacher(): Attribute
    {
        return Attribute::get(fn (): ?TeacherProfile => $this->primaryTeacher->first());
    }

    /**
     * Return every subject taught by the class with each row's primary marker.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'class_subjects', 'class_id', 'subject_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    /**
     * Return the representative subject selected for this class.
     *
     * @return BelongsToMany<Subject, $this>
     */
    public function primarySubject(): BelongsToMany
    {
        return $this->subjects()->wherePivot('is_primary', true);
    }

    /**
     * Return the full teaching team with each row's lead marker.
     *
     * @return BelongsToMany<TeacherProfile, $this>
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(TeacherProfile::class, 'class_teachers', 'class_id', 'teacher_id', 'id', 'profile_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    /**
     * Return the lead teacher selected for this class.
     *
     * @return BelongsToMany<TeacherProfile, $this>
     */
    public function primaryTeacher(): BelongsToMany
    {
        return $this->teachers()->wherePivot('is_primary', true);
    }

    /**
     * Return the non-primary teachers assigned as assistants.
     *
     * @return BelongsToMany<TeacherProfile, $this>
     */
    public function assistantTeachers(): BelongsToMany
    {
        return $this->teachers()->wherePivot('is_primary', false);
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
