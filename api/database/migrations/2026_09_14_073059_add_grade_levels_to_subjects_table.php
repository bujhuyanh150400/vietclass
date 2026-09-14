<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the JSONB applicability list and its containment-query index.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table): void {
            $table->jsonb('grade_levels')->default(DB::raw("'[]'::jsonb"));
        });

        DB::statement('CREATE INDEX subjects_grade_levels_gin_index ON subjects USING GIN (grade_levels jsonb_path_ops)');
    }

    /**
     * Remove the applicability storage and index together.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS subjects_grade_levels_gin_index');

        Schema::table('subjects', function (Blueprint $table): void {
            $table->dropColumn('grade_levels');
        });
    }
};
