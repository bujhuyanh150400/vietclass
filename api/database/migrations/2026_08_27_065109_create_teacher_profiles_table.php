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
        Schema::create('teacher_profiles', function (Blueprint $table) {
            // Khóa chính dùng chung với profiles. Đây là thứ khiến classes.teacher_id
            // không thể trỏ vào một hồ sơ không mang vai trò dạy học: hồ sơ đó đơn giản
            // không có dòng nào ở đây để tham chiếu tới.
            $table->foreignId('profile_id')->constrained()->cascadeOnDelete();
            $table->primary('profile_id');
            $table->smallInteger('status')->default(0)->index();
            $table->date('joined_at');
            $table->string('color_identification', 20)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_profiles');
    }
};
