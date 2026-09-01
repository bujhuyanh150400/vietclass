<?php

namespace App\Modules\Schedule\Models;

use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use Database\Factories\ScheduleInstanceTeacherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One person's assignment to one session, with the role they hold and whoever they are
 * standing in for.
 *
 * Materialising a projected session copies these rows across from
 * `schedule_template_teachers`, keeping each role and leaving `replaces_profile_id` null,
 * because copying a schedule is not a substitution.
 *
 * Role and substitution are two separate axes. Folding substitution into `role` would
 * make "an assistant covering for somebody" impossible to record, and that happens.
 */
#[Fillable([
    'schedule_instance_id',
    'teacher_profile_id',
    'role',
    'replaces_profile_id',
])]
final class ScheduleInstanceTeacher extends Model
{
    /** @use HasFactory<ScheduleInstanceTeacherFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the session-teacher model.
     */
    protected static function newFactory(): ScheduleInstanceTeacherFactory
    {
        return ScheduleInstanceTeacherFactory::new();
    }

    /**
     * Define model casts for database-backed session-teacher attributes.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => ScheduleTeacherRole::class,
        ];
    }

    /**
     * Return the session this assignment belongs to.
     *
     * @return BelongsTo<ScheduleInstance, $this>
     */
    public function scheduleInstance(): BelongsTo
    {
        return $this->belongsTo(ScheduleInstance::class, 'schedule_instance_id');
    }

    /**
     * Return the person actually teaching.
     *
     * The key stored here is the shared `profile_id`, so the foreign key can only
     * resolve to somebody who actually holds a teaching role.
     *
     * @return BelongsTo<TeacherProfile, $this>
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_profile_id', 'profile_id');
    }

    /**
     * Return the person this row stands in for, or null when it is not a substitution.
     *
     * @return BelongsTo<TeacherProfile, $this>
     */
    public function replaces(): BelongsTo
    {
        return $this->belongsTo(TeacherProfile::class, 'replaces_profile_id', 'profile_id');
    }
}
