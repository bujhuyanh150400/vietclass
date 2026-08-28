<?php

namespace Database\Factories;

use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Enums\StudentStatus;
use App\Modules\Identity\Enums\UserRole;
use App\Modules\Identity\Models\Profile;
use App\Modules\Identity\Models\StudentProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    /** @var class-string<StudentProfile> */
    protected $model = StudentProfile::class;

    /**
     * Define the model's default state, including the profile and account beneath it.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'profile_id' => Profile::factory()
                ->forRole(UserRole::Student)
                ->state(fn (): array => [
                    'dob' => fake()->dateTimeBetween('-18 years', '-6 years')->format('Y-m-d'),
                ]),
            'grade_level' => fake()->randomElement(GradeLevel::cases()),
            'status' => StudentStatus::Studying,
        ];
    }
}
