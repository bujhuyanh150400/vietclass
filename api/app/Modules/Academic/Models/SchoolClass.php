<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Models\Teacher;
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
    'base_fee_per_session',
    'teacher_salary_per_session',
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
        'base_fee_per_session' => 0,
        'teacher_salary_per_session' => 0,
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
            'base_fee_per_session' => 'decimal:0',
            'teacher_salary_per_session' => 'decimal:0',
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
     * @return BelongsTo<Teacher, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
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
