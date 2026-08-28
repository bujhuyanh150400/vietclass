<?php

namespace App\Modules\Identity\Models;

use App\Modules\Identity\Enums\GuardianRelationship;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'student_profile_id',
    'guardian_profile_id',
    'relationship',
    'is_primary',
])]
final class StudentGuardian extends Model
{
    protected $table = 'student_guardians';

    /**
     * Define model casts for database-backed guardian link attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'relationship' => GuardianRelationship::class,
            'is_primary' => 'boolean',
        ];
    }

    /**
     * Return the profile of the person acting as guardian.
     *
     * @return BelongsTo<Profile, $this>
     */
    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'guardian_profile_id');
    }

    /**
     * Return the student this link belongs to.
     *
     * @return BelongsTo<StudentProfile, $this>
     */
    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id', 'profile_id');
    }
}
