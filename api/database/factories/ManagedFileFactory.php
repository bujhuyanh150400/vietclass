<?php

namespace Database\Factories;

use App\Modules\FileManagement\Models\ManagedFile;
use App\Modules\Identity\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ManagedFile>
 */
class ManagedFileFactory extends Factory
{
    /** @var class-string<ManagedFile> */
    protected $model = ManagedFile::class;

    /**
     * Define the managed file's default metadata.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_user_id' => User::factory(),
            'original_name' => 'avatar.png',
            'display_name' => 'Avatar',
            'disk' => 'local',
            'path' => fake()->uuid().'.png',
            'extension' => 'png',
            'mime_type' => 'image/png',
            'size_bytes' => 1024,
        ];
    }
}
