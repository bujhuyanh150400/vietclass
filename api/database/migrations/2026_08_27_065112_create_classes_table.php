<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 50);
            $table->foreignId('subject_id')->index()->constrained();
            $table->foreignId('teacher_id')->index()->constrained('teacher_profiles', 'profile_id');
            $table->smallInteger('grade_level')->index();
            // The fork stored this as a tinyint, capping every class at 255 students
            // for no stated reason.
            $table->unsignedSmallInteger('max_students')->default(0);
            $table->smallInteger('status')->default(0)->index();
            $table->date('start_at');
            $table->date('end_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
