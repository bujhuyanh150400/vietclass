<?php

namespace Database\Factories;

use App\Modules\Academic\Enums\ClassStatus;
use App\Modules\Academic\Enums\GradeLevel;
use App\Modules\Academic\Models\SchoolClass;
use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;
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
            'teacher_id' => TeacherProfile::factory(),
            'grade_level' => fake()->randomElement(GradeLevel::cases()),
            'max_students' => 20,
            'status' => ClassStatus::Active,
            'start_at' => now()->subMonth()->toDateString(),
            'end_at' => null,
        ];
    }

    /**
     * Move legacy scalar factory inputs into the normalized primary relationship rows.
     */
    public function configure(): static
    {
        return $this->afterMaking(static function (SchoolClass $class): void {
            $attributes = $class->getAttributes();
            $class->setRelation('factoryPrimaryAssignments', [
                'subject_id' => $attributes['subject_id'] ?? null,
                'teacher_id' => $attributes['teacher_id'] ?? null,
            ]);
            $class->offsetUnset('subject_id');
            $class->offsetUnset('teacher_id');
        })->afterCreating(static function (SchoolClass $class): void {
            $primary = $class->getRelation('factoryPrimaryAssignments');
            $class->subjects()->sync([(int) $primary['subject_id'] => ['is_primary' => true]]);
            $class->teachers()->sync([(int) $primary['teacher_id'] => ['is_primary' => true]]);
            $class->unsetRelation('factoryPrimaryAssignments');
        });
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
