<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** @var class-string<User> */
    protected $model = User::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => UserRole::Admin,
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    /** Create one opt-in personal profile after the account exists without factory recursion. */
    public function withProfile(): static
    {
        return $this->afterCreating(fn (User $user) => Profile::factory()->create([
            'user_id' => $user->id,
        ]));
    }
}
