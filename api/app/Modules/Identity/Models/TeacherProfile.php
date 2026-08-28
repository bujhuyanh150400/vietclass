<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\TeacherStatus;
use Database\Factories\TeacherProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
