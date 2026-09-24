<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Store every subject taught by each class, including its representative subject.
     */
    public function up(): void
    {
        Schema::create('class_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->restrictOnDelete();
            $table->unique(['class_id', 'subject_id']);
            $table->index('subject_id');
            $table->timestamps();
        });
    }

    /**
     * Remove the class-subject association on schema rollback.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_subjects');
    }
};
