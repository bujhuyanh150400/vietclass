<?php

namespace App\Modules\Academic\Models;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\TeacherStatus;
use Database\Factories\TeacherProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'profile_id',
    'status',
    'joined_at',
    'color_identification',
])]
final class TeacherProfile extends Model
{
    /** @use HasFactory<TeacherProfileFactory> */
    use HasFactory;

    protected $table = 'teacher_profiles';

    /** The key is shared with the profile row rather than generated here. */
    protected $primaryKey = 'profile_id';

    public $incrementing = false;

    protected $keyType = 'int';

    /** @var array<string, int> */
    protected $attributes = [
        'status' => TeacherStatus::Active->value,
    ];

    /**
     * Create the dedicated factory for the teacher profile model.
     */
    protected static function newFactory(): TeacherProfileFactory
    {
        return TeacherProfileFactory::new();
    }

    /**
     * Define model casts for database-backed teaching attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => TeacherStatus::class,
            'joined_at' => 'date',
        ];
    }

    /**
     * Return the shared profile this teaching role belongs to.
     *
     * @return BelongsTo<Profile, $this>
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'profile_id');
    }

    /**
     * Return the classes this teacher leads through the normalized teaching team.
     *
     * @return BelongsToMany<SchoolClass, $this>
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teachers', 'teacher_id', 'class_id', 'profile_id', 'id')
            ->wherePivot('is_primary', true)
            ->withTimestamps();
    }

    /**
     * Return the active classes this teacher assists without exposing ended assignments as current.
     *
     * @return BelongsToMany<SchoolClass, $this>
     */
    public function assistantClasses(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teachers', 'teacher_id', 'class_id', 'profile_id', 'id')
            ->wherePivot('is_primary', false)
            ->where('status', ClassStatus::Active)
            ->withTimestamps();
    }

    /** Return ended classes where this teacher remains the historical lead. */
    public function endedClasses(): BelongsToMany
    {
        return $this->classes()->where('status', ClassStatus::Ended);
    }

    /** Return ended classes where this teacher's assistant assignment remains in the historical team. */
    public function endedAssistantClasses(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_teachers', 'teacher_id', 'class_id', 'profile_id', 'id')
            ->wherePivot('is_primary', false)
            ->where('status', ClassStatus::Ended)
            ->withTimestamps();
    }
}
