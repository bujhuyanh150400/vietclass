<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\Gender;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Student;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /** @var class-string<Student> */
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => UserRole::Student]),
            'full_name' => fake()->name(),
            'phone' => '0'.fake()->numerify('#########'),
            'dob' => fake()->dateTimeBetween('-18 years', '-6 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(Gender::cases()),
            'grade_level' => fake()->randomElement(GradeLevel::cases()),
            'parent_name' => fake()->name(),
            'parent_phone' => '0'.fake()->numerify('#########'),
            'address' => fake()->optional()->address(),
            'note' => null,
            'status' => StudentStatus::Studying,
        ];
    }
}
