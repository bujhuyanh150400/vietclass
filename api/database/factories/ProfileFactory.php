<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Profile>
 */
class ProfileFactory extends Factory
{
    /** @var class-string<Profile> */
    protected $model = Profile::class;

    /**
     * Define the model's default state. A profile carries no login account unless one
     * is asked for, because a guardian entered from the student form starts without one.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'full_name' => fake()->name(),
            'phone' => '0'.fake()->unique()->numerify('#########'),
            'email' => null,
            'dob' => null,
            'gender' => fake()->randomElement(Gender::cases()),
            'address' => fake()->optional()->address(),
            'note' => null,
            'metadata' => [],
        ];
    }

    /**
     * Attach a new login account carrying the given role.
     */
    public function forRole(UserRole $role): static
    {
        return $this->state(fn (): array => [
            'user_id' => User::factory()->state(['role' => $role]),
        ]);
    }
}
