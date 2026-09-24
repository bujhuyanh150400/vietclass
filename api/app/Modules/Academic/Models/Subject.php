<?php

namespace App\Modules\Academic\Models;

use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'description', 'grade_levels', 'is_active'])]
final class Subject extends Model
{
    /** @use HasFactory<SubjectFactory> */
    use HasFactory;

    /** @var array<string, bool|string> */
    protected $attributes = [
        'grade_levels' => '[]',
        'is_active' => true,
    ];

    /**
     * Create the dedicated factory for the subject model.
     */
    protected static function newFactory(): SubjectFactory
    {
        return SubjectFactory::new();
    }

    /**
     * Define model casts for database-backed subject attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'grade_levels' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Return every class that teaches this subject, whether primary or additional.
     *
     * @return BelongsToMany<SchoolClass, $this>
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_subjects', 'subject_id', 'class_id')
            ->withPivot('is_primary')
            ->withTimestamps();
    }
}
