<?php

namespace Database\Factories;

use App\Modules\Identity\Models\TeacherProfile;
use App\Modules\Schedule\Enums\ScheduleTeacherRole;
use App\Modules\Schedule\Models\ScheduleTemplate;
use App\Modules\Schedule\Models\ScheduleTemplateTeacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleTemplateTeacher>
 */
class ScheduleTemplateTeacherFactory extends Factory
{
    /** @var class-string<ScheduleTemplateTeacher> */
    protected $model = ScheduleTemplateTeacher::class;

    /**
     * Define the model's default state, which is the schedule's main teacher.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'schedule_template_id' => ScheduleTemplate::factory(),
            'teacher_profile_id' => TeacherProfile::factory(),
            'role' => ScheduleTeacherRole::MainTeacher,
        ];
    }

    /**
     * Make an assisting teacher instead of the main one.
     */
    public function assistant(): static
    {
        return $this->state(fn (): array => ['role' => ScheduleTeacherRole::Assistant]);
    }
}
