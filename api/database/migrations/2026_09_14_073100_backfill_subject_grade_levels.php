<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Give legacy subjects the complete grade range they historically supported.
     */
    public function up(): void
    {
        DB::table('subjects')->update([
            'grade_levels' => json_encode(range(0, 12), JSON_THROW_ON_ERROR),
        ]);
    }

    /**
     * Preserve the complete assignment because the old schema cannot restore it.
     */
    public function down(): void
    {
        // This data migration is intentionally irreversible.
    }
};
