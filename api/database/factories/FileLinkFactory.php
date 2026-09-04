<?php

namespace Database\Factories;

use App\Modules\FileManagement\Enums\FileLinkType;
use App\Modules\FileManagement\Models\FileLink;
use App\Modules\FileManagement\Models\ManagedFile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FileLink>
 */
class FileLinkFactory extends Factory
{
    /** @var class-string<FileLink> */
    protected $model = FileLink::class;

    /**
     * Define the managed file link's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'file_id' => ManagedFile::factory(),
            'type' => FileLinkType::ProfileAvatar,
            'foreign_id' => fake()->numberBetween(1),
        ];
    }
}
