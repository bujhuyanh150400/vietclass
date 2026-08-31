<?php

namespace Database\Factories;

use App\Modules\Academic\Enums\RoomStatus;
use App\Modules\Academic\Models\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Room>
 */
class RoomFactory extends Factory
{
    /** @var class-string<Room> */
    protected $model = Room::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Phòng '.fake()->unique()->numerify('###'),
            'capacity' => fake()->numberBetween(0, 120),
            'note' => fake()->optional()->sentence(),
            'status' => RoomStatus::Active,
        ];
    }

    /**
     * Make a room that cannot be assigned to new schedules.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => RoomStatus::Inactive]);
    }

    /**
     * Make a room that is unavailable while it undergoes maintenance.
     */
    public function maintenance(): static
    {
        return $this->state(fn (): array => ['status' => RoomStatus::Maintenance]);
    }
}
