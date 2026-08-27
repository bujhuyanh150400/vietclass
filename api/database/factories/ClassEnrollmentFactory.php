<?php

namespace Database\Factories;

use App\Modules\Academic\Models\ClassEnrollment;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Identity\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassEnrollment>
 */
class ClassEnrollmentFactory extends Factory
{
    /** @var class-string<ClassEnrollment> */
    protected $model = ClassEnrollment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'class_id' => SchoolClass::factory(),
            'student_id' => Student::factory(),
            'fee_per_session' => null,
            'enrolled_at' => now()->subWeek()->toDateString(),
            'left_at' => null,
            'note' => null,
        ];
    }

    /**
     * Make an enrolment the student has already left, which is the state that allows
     * the same student to be enrolled in the class again.
     */
    public function left(): static
    {
        return $this->state(fn (): array => [
            'left_at' => now()->subDay()->toDateString(),
        ]);
    }
}
