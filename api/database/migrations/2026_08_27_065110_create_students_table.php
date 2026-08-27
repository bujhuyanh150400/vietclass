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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained();
            $table->string('full_name', 255);
            $table->string('phone', 20)->nullable();
            $table->date('dob')->nullable();
            $table->smallInteger('gender');
            $table->smallInteger('grade_level')->index();
            $table->string('parent_name', 255);
            $table->string('parent_phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->text('note')->nullable();
            $table->smallInteger('status')->default(0)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
