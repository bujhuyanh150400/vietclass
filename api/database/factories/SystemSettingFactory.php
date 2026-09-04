<?php

namespace Database\Factories;

use App\Modules\System\Models\SystemSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<SystemSetting> */
class SystemSettingFactory extends Factory
{
    /** @var class-string<SystemSetting> */
    protected $model = SystemSetting::class;

    /**
     * Define the default persisted system setting.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->bothify('setting_####'),
            'value' => [],
            'description' => null,
            'updated_by' => null,
        ];
    }
}
