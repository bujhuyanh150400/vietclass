<?php

namespace Database\Factories;

use App\Modules\Auth\Models\Feature;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feature>
 */
class FeatureFactory extends Factory
{
    /** @var class-string<Feature> */
    protected $model = Feature::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $group = fake()->unique()->word();

        return [
            'code' => "{$group}.view",
            'name' => "Xem {$group}",
            'group_code' => $group,
            'description' => null,
        ];
    }
}
