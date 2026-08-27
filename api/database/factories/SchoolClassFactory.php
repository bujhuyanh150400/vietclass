<?php

namespace Database\Factories;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Identity\Enums\GradeLevel;
use App\Modules\Identity\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    /** @var class-string<SchoolClass> */
    protected $model = SchoolClass::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => mb_strtoupper(fake()->unique()->bothify('??##-##')),
            'name' => 'Lớp '.fake()->bothify('?#'),
            'subject_id' => Subject::factory(),
            'teacher_id' => Teacher::factory(),
            'grade_level' => fake()->randomElement(GradeLevel::cases()),
            'max_students' => 20,
            'status' => ClassStatus::Active,
            'start_at' => now()->subMonth()->toDateString(),
            'end_at' => null,
        ];
    }

    /**
     * Make a class that has finished and therefore refuses every enrolment operation.
     */
    public function ended(): static
    {
        return $this->state(fn (): array => [
            'status' => ClassStatus::Ended,
            'end_at' => now()->toDateString(),
        ]);
    }
}
