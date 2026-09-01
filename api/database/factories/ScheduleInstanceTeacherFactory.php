<?php

namespace Database\Factories;

use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleInstance;
use App\Modules\Schedule\Models\ScheduleInstanceTeacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleInstanceTeacher>
 */
class ScheduleInstanceTeacherFactory extends Factory
{
    /** @var class-string<ScheduleInstanceTeacher> */
    protected $model = ScheduleInstanceTeacher::class;

    /**
     * Define the model's default state, which is the session's main teacher standing in
     * for nobody.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'schedule_instance_id' => ScheduleInstance::factory(),
            'teacher_profile_id' => TeacherProfile::factory(),
            'role' => ScheduleTeacherRole::MainTeacher,
            'replaces_profile_id' => null,
        ];
    }

    /**
     * Make an assisting teacher instead of the main one.
     */
    public function assistant(): static
    {
        return $this->state(fn (): array => ['role' => ScheduleTeacherRole::Assistant]);
    }

    /**
     * Make a row that records this person covering for somebody else.
     */
    public function replacing(int $replacedProfileId): static
    {
        return $this->state(fn (): array => ['replaces_profile_id' => $replacedProfileId]);
    }
}
