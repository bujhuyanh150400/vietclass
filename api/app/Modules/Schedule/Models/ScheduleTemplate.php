<?php

namespace App\Modules\Schedule\Models;

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use Database\Factories\ScheduleTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * One weekly slot a class occupies, effective over a date range.
 *
 * A class taught twice a week has two rows. A running schedule is never edited in
 * place: the old row is closed with `end_date` and a new row opens from the effective
 * date, so the rows together read as the class's schedule history.
 *
 * There is no `teacher_id` column. Teachers are rows in `schedule_template_teachers`
 * carrying a role, stated explicitly and never inherited from the class, which makes
 * "a session with nobody teaching it" a state the schema cannot express.
 */
#[Fillable([
    'class_id',
    'day_of_week',
    'start_time',
    'end_time',
    'room_id',
    'start_date',
    'end_date',
    'created_by',
    'updated_by',
])]
final class ScheduleTemplate extends Model
{
    /** @use HasFactory<ScheduleTemplateFactory> */
    use HasFactory;

    /**
     * Create the dedicated factory for the fixed-schedule model.
     */
    protected static function newFactory(): ScheduleTemplateFactory
    {
        return ScheduleTemplateFactory::new();
    }

    /**
     * Define model casts for database-backed fixed-schedule attributes.
     *
     * `start_time` and `end_time` stay raw `HH:MM:SS` strings: they carry no date, so
     * casting them to Carbon would attach today's date to a value that has none.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_of_week' => DayOfWeek::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Return the class this schedule belongs to.
     *
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Return the room this schedule occupies.
     *
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Return every teacher assigned to this schedule, whatever their role.
     *
     * This is what the double-booking check reads: a clash is a clash regardless of
     * who is main teacher and who assists.
     *
     * @return HasMany<ScheduleTemplateTeacher, $this>
     */
    public function teachers(): HasMany
    {
        return $this->hasMany(ScheduleTemplateTeacher::class, 'schedule_template_id');
    }

    /**
     * Return the single main teacher of this schedule.
     *
     * This relation and `assistantTeachers()` are the only places the application
     * decides what a role value means; the database guarantees at most one row here
     * through the `schedule_template_main_teacher_unique` partial unique index.
     *
     * @return HasOne<ScheduleTemplateTeacher, $this>
     */
    public function mainTeacher(): HasOne
    {
        return $this->hasOne(ScheduleTemplateTeacher::class, 'schedule_template_id')
            ->where('role', ScheduleTeacherRole::MainTeacher);
    }

    /**
     * Return the assistants of this schedule, which may be none.
     *
     * @return HasMany<ScheduleTemplateTeacher, $this>
     */
    public function assistantTeachers(): HasMany
    {
        return $this->hasMany(ScheduleTemplateTeacher::class, 'schedule_template_id')
            ->where('role', ScheduleTeacherRole::Assistant);
    }

    /**
     * Return the user who created this schedule.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Return the user who last changed this schedule, or null while nobody has.
     *
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
