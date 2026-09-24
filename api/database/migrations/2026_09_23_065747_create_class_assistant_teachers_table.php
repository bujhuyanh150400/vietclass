<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Store the assistants assigned to each class without duplicating its lead.
     */
    public function up(): void
    {
        Schema::create('class_assistant_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('teacher_profiles', 'profile_id')->restrictOnDelete();
            $table->unique(['class_id', 'teacher_id']);
            $table->index('teacher_id');
            $table->timestamps();
        });
    }

    /**
     * Remove the class-assistant association on schema rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_assistant_teachers');
    }
};
