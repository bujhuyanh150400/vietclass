<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add primary-role storage and a normalized class teaching-team relation.
     */
    public function up(): void
    {
        Schema::table('class_subjects', function (Blueprint $table) {
            $table->boolean('is_primary')->default(false);
        });

        Schema::create('class_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teacher_profiles', 'profile_id')->restrictOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->unique(['class_id', 'teacher_id']);
            $table->index('teacher_id');
            $table->timestamps();
        });

        DB::statement('CREATE UNIQUE INDEX class_subjects_one_primary_per_class_unique ON class_subjects (class_id) WHERE is_primary');
        DB::statement('CREATE UNIQUE INDEX class_teachers_one_primary_per_class_unique ON class_teachers (class_id) WHERE is_primary');
    }

    /**
     * Restore legacy scalar constraints after rollback data is copied, then remove normalized-only schema.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE classes ALTER COLUMN subject_id SET NOT NULL');
        DB::statement('ALTER TABLE classes ALTER COLUMN teacher_id SET NOT NULL');

        Schema::table('classes', function (Blueprint $table) {
            $table->index('subject_id');
            $table->index('teacher_id');
            $table->foreign('subject_id')->references('id')->on('subjects');
            $table->foreign('teacher_id')->references('profile_id')->on('teacher_profiles');
        });

        DB::statement('DROP INDEX IF EXISTS class_subjects_one_primary_per_class_unique');
        DB::statement('DROP INDEX IF EXISTS class_teachers_one_primary_per_class_unique');
        Schema::dropIfExists('class_teachers');
        Schema::table('class_subjects', function (Blueprint $table) {
            $table->dropColumn('is_primary');
        });
    }
};
