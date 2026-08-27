<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\EmployeeStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Teacher;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    /** @var class-string<Teacher> */
    protected $model = Teacher::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Teacher]),
            'full_name' => fake()->name(),
            'phone' => '0'.fake()->unique()->numerify('#########'),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->optional()->address(),
            'status' => EmployeeStatus::Active,
            'color' => fake()->hexColor(),
            'joined_at' => fake()->dateTimeBetween('-3 years')->format('Y-m-d'),
        ];
    }

    /**
     * Make a teacher who has left and can no longer be assigned to a class.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => EmployeeStatus::Inactive]);
    }
}
