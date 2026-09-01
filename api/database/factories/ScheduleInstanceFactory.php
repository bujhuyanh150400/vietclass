<?php

namespace Database\Factories;

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Enums\ScheduleStatus;
use App\Modules\Schedule\Enums\ScheduleType;
use App\Modules\Schedule\Models\ScheduleInstance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleInstance>
 */
class ScheduleInstanceFactory extends Factory
{
    /** @var class-string<ScheduleInstance> */
    protected $model = ScheduleInstance::class;

    /**
     * Define the model's default state: a stand-alone session today that no fixed
     * schedule produced.
     *
     * `template_id` is left null so the default state cannot collide with
     * `UNIQUE (template_id, date)`; a test that wants a materialised session states the
     * schedule it came from itself, which is also the only way the rule
     * "template implies class" stays visible.
     *
     * No teacher row is created here, matching `ScheduleTemplateFactory`. A session's
     * teacher list is written through an Action so the one-main-teacher rule is applied,
     * and a factory that quietly attached one would hide that from every test.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'class_id' => SchoolClass::factory(),
            'template_id' => null,
            'subject_id' => Subject::factory(),
            'date' => now()->toDateString(),
            'start_time' => '08:00:00',
            'end_time' => '09:30:00',
            'room_id' => Room::factory(),
            'schedule_type' => ScheduleType::Regular,
            'status' => ScheduleStatus::Pending,
            'linked_makeup_for' => null,
            'is_customized' => false,
            'note' => null,
            'created_by' => User::factory(),
            'updated_by' => null,
        ];
    }

    /**
     * Make a session materialised from a fixed schedule on a given date.
     */
    public function fromTemplate(int $templateId, string $date): static
    {
        return $this->state(fn (): array => [
            'template_id' => $templateId,
            'date' => $date,
            'is_customized' => true,
        ]);
    }

    /**
     * Make a session somebody has cancelled, which no longer occupies its room or its
     * teachers' time.
     */
    public function cancelled(): static
    {
        return $this->state(fn (): array => ['status' => ScheduleStatus::Cancelled]);
    }

    /**
     * Make a session that has already been taught and is therefore locked down to its
     * note.
     */
    public function completed(): static
    {
        return $this->state(fn (): array => ['status' => ScheduleStatus::Completed]);
    }
}
