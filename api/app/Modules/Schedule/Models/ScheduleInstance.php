<?php

namespace App\Modules\Schedule\Models;

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Enums\ScheduleType;
use Database\Factories\ScheduleInstanceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * One lesson on one date — the table attendance, marks, and fees will all join back to.
 *
 * This table does not hold every session of every class. It holds the ones somebody has
 * acted on. Reading the calendar is the union of the rows written here and the *projected
 * sessions* `ScheduleProjector` derives from the fixed schedules; a projected session
 * becomes a row here only when it is materialised. `UNIQUE (template_id, date)` is what
 * makes that materialisation idempotent, and it is also what tells the projection which
 * projected sessions to drop, because a written row always wins over a projected one.
 *
 * There is no `teacher_id` and no `original_teacher_id`. Both live in
 * `schedule_instance_teachers`, where a row carries the role its holder plays and,
 * separately, the person they stand in for.
 */
#[Fillable([
    'class_id',
    'template_id',
    'subject_id',
    'date',
    'start_time',
    'end_time',
    'room_id',
    'schedule_type',
    'status',
    'linked_makeup_for',
    'is_customized',
    'note',
    'created_by',
    'updated_by',
])]
final class ScheduleInstance extends Model
{
    /** @use HasFactory<ScheduleInstanceFactory> */
    use HasFactory;

    /** @var array<string, mixed> */
    protected $attributes = [
        'schedule_type' => ScheduleType::Regular->value,
        'status' => ScheduleStatus::Pending->value,
        'is_customized' => false,
    ];

    /**
     * Create the dedicated factory for the session model.
     */
    protected static function newFactory(): ScheduleInstanceFactory
    {
        return ScheduleInstanceFactory::new();
    }

    /**
     * Define model casts for database-backed session attributes.
     *
     * `start_time` and `end_time` stay raw `HH:MM:SS` strings, matching
     * `ScheduleTemplate`: they carry no date, so casting them to Carbon would attach
     * today's date to a value that has none.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'schedule_type' => ScheduleType::class,
            'status' => ScheduleStatus::class,
            'is_customized' => 'boolean',
        ];
    }

    /**
     * Return the class this session belongs to, or null for a session that belongs to
     * none — a pooled make-up or an extra lesson.
     *
     * @return BelongsTo<SchoolClass, $this>
     */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Return the fixed schedule this session was projected from, or null when no weekly
     * schedule produced it.
     *
     * @return BelongsTo<ScheduleTemplate, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(ScheduleTemplate::class, 'template_id');
    }

    /**
     * Return the subject taught in this session.
     *
     * @return BelongsTo<Subject, $this>
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Return the room this session occupies.
     *
     * @return BelongsTo<Room, $this>
     */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Return everybody teaching this session, whatever their role.
     *
     * This is what the double-booking check reads: a clash is a clash regardless of who
     * is main teacher and who assists.
     *
     * @return HasMany<ScheduleInstanceTeacher, $this>
     */
    public function teachers(): HasMany
    {
        return $this->hasMany(ScheduleInstanceTeacher::class, 'schedule_instance_id');
    }

    /**
     * Return the single main teacher of this session.
     *
     * This relation and `assistantTeachers()` are the only places the application
     * decides what a role value means; the database guarantees at most one row here
     * through the `schedule_instance_main_teacher_unique` partial unique index.
     *
     * @return HasOne<ScheduleInstanceTeacher, $this>
     */
    public function mainTeacher(): HasOne
    {
        return $this->hasOne(ScheduleInstanceTeacher::class, 'schedule_instance_id')
            ->where('role', ScheduleTeacherRole::MainTeacher);
    }

    /**
     * Return the assistants of this session, which may be none.
     *
     * @return HasMany<ScheduleInstanceTeacher, $this>
     */
    public function assistantTeachers(): HasMany
    {
        return $this->hasMany(ScheduleInstanceTeacher::class, 'schedule_instance_id')
            ->where('role', ScheduleTeacherRole::Assistant);
    }

    /**
     * Return the cancelled session this one makes up for, or null when it makes up for
     * nothing.
     *
     * @return BelongsTo<ScheduleInstance, $this>
     */
    public function makeupFor(): BelongsTo
    {
        return $this->belongsTo(self::class, 'linked_makeup_for');
    }

    /**
     * Return the make-up session arranged for this one, or null while none is.
     *
     * At most one exists: `linked_makeup_for` is unique, so a cancelled session cannot
     * collect two replacements.
     *
     * @return HasOne<ScheduleInstance, $this>
     */
    public function makeupSession(): HasOne
    {
        return $this->hasOne(self::class, 'linked_makeup_for');
    }

    /**
     * Return the user who created this session.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Return the user who last changed this session, or null while nobody has.
     *
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
