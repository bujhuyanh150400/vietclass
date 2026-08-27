<?php

namespace Database\Seeders;

use App\Modules\Academic\Models\Subject;
use Illuminate\Database\Seeder;

final class AcademicSeeder extends Seeder
{
    /**
     * Seed the subjects a local environment needs before a class can be created,
     * without creating duplicates on a repeated run.
     */
    public function run(): void
    {
        $subjects = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học'];

        foreach ($subjects as $name) {
            Subject::query()->updateOrCreate(
                ['name' => $name],
                ['is_active' => true],
            );
        }
    }
}
