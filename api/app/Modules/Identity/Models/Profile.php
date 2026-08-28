<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\Gender;
use Database\Factories\ProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id',
    'full_name',
    'phone',
    'email',
    'dob',
    'gender',
    'address',
    'note',
    'metadata',
])]
final class Profile extends Model
{
    /** @use HasFactory<ProfileFactory> */
    use HasFactory;

    /** @var array<string, string> */
    protected $attributes = [
        'metadata' => '{}',
    ];

    /**
     * Create the dedicated factory for the profile model.
     */
    protected static function newFactory(): ProfileFactory
    {
        return ProfileFactory::new();
    }

    /**
     * Define model casts for database-backed profile attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dob' => 'date',
            'gender' => Gender::class,
            'metadata' => 'array',
        ];
    }

    /**
     * Return the login account this profile belongs to, when it has one.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Return the teaching role attached to this profile, when it has one.
     *
     * @return HasOne<TeacherProfile, $this>
     */
    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class, 'profile_id');
    }

    /**
     * Return the student role attached to this profile, when it has one.
     *
     * @return HasOne<StudentProfile, $this>
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class, 'profile_id');
    }
}
