<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\TeacherStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\TeacherProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherProfile>
 */
class TeacherProfileFactory extends Factory
{
    /** @var class-string<TeacherProfile> */
    protected $model = TeacherProfile::class;

    /**
     * Define the model's default state, including the profile and account beneath it.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'profile_id' => Profile::factory()
                ->forRole(UserRole::Teacher)
                ->state(fn (): array => ['email' => fake()->unique()->safeEmail()]),
            'status' => TeacherStatus::Active,
            'joined_at' => fake()->dateTimeBetween('-3 years')->format('Y-m-d'),
            'color_identification' => fake()->hexColor(),
        ];
    }

    /**
     * Make a teacher who has left and can no longer be assigned to a class.
     */
    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => TeacherStatus::Inactive]);
    }
}
