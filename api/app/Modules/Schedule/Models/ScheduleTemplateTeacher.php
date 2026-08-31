<?php

namespace App\Modules\Schedule\Models;

use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use Database\Factories\ScheduleTemplateTeacherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One teacher's assignment to a fixed schedule, with the role they hold on it.
 *
 * Sessions projected from the schedule inherit exactly this list.
 */
#[Fillable([
    'schedule_template_id',
    'teacher_profile_id',
    'role',
])]
final class ScheduleTemplateTeacher extends Model
{
    /** @use HasFactory<ScheduleTemplateTeacherFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the schedule-teacher model.
     */
    protected static function newFactory(): ScheduleTemplateTeacherFactory
    {
        return ScheduleTemplateTeacherFactory::new();
    }

    /**
     * Define model casts for database-backed schedule-teacher attributes.
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
     * Return the fixed schedule this assignment belongs to.
     *
     * @return BelongsTo<ScheduleTemplate, $this>
     */
    public function scheduleTemplate(): BelongsTo
    {
        return $this->belongsTo(ScheduleTemplate::class, 'schedule_template_id');
    }

    /**
     * Return the assigned teacher.
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
}
