<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use Database\Factories\StudentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'full_name',
    'phone',
    'dob',
    'gender',
    'grade_level',
    'parent_name',
    'parent_phone',
    'address',
    'note',
    'status',
])]
final class Student extends Model
{
    /** @use HasFactory<StudentFactory> */
    use HasFactory;

    /** @var array<string, int> */
    protected $attributes = [
        'status' => StudentStatus::Studying->value,
    ];

    /**
     * Create the dedicated factory for the student model.
     */
    protected static function newFactory(): StudentFactory
    {
        return StudentFactory::new();
    }

    /**
     * Define model casts for database-backed student attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'gender' => Gender::class,
            'grade_level' => GradeLevel::class,
            'status' => StudentStatus::class,
        ];
    }

    /**
     * Return the login account this profile belongs to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
