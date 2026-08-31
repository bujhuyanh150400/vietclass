<?php

namespace Database\Factories;

use App\Modules\Academic\Models\Room;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Models\User;
use App\Modules\Schedule\Enums\DayOfWeek;
use App\Modules\Schedule\Models\ScheduleTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleTemplate>
 */
class ScheduleTemplateFactory extends Factory
{
    /** @var class-string<ScheduleTemplate> */
    protected $model = ScheduleTemplate::class;

    /**
     * Define the model's default state: an open-ended morning slot on a weekday.
     *
     * No teacher row is created here. A schedule's teacher list is written through
     * the repository so the one-main-teacher rule is applied, and a factory that
     * quietly attached one would hide that from every test.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'class_id' => SchoolClass::factory(),
            'day_of_week' => fake()->randomElement(DayOfWeek::cases()),
            'start_time' => '08:00:00',
            'end_time' => '09:30:00',
            'room_id' => Room::factory(),
            'start_date' => now()->toDateString(),
            'end_date' => null,
            'created_by' => User::factory(),
            'updated_by' => null,
        ];
    }

    /**
     * Make a schedule that stopped applying on the given date.
     */
    public function closedOn(string $endDate): static
    {
        return $this->state(fn (): array => ['end_date' => $endDate]);
    }
}
