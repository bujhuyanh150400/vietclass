<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the legacy scalar class assignments after their normalized rows are populated.
     */
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subject_id');
            $table->dropConstrainedForeignId('teacher_id');
        });

        Schema::drop('class_assistant_teachers');
    }

    /**
     * Recreate nullable legacy columns and the assistant table before rollback data restoration.
     */
    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('subject_id')->nullable();
            $table->foreignId('teacher_id')->nullable();
        });

        Schema::create('class_assistant_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teacher_profiles', 'profile_id')->restrictOnDelete();
            $table->unique(['class_id', 'teacher_id']);
            $table->index('teacher_id');
            $table->timestamps();
        });
    }
};
