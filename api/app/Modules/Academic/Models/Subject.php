<?php

namespace App\Modules\Academic\Models;

use Database\Factories\SubjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
     * Return the classes taught for this subject, which is what blocks a subject
     * from being deactivated or removed.
     *
     * @return HasMany<SchoolClass, $this>
     */
    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }
}
