<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->index()
                ->constrained('student_profiles', 'profile_id')->cascadeOnDelete();
            // RESTRICT vì không được xóa một hồ sơ còn đang là người giám hộ của ai đó.
            $table->foreignId('guardian_profile_id')->index()
                ->constrained('profiles')->restrictOnDelete();
            $table->smallInteger('relationship');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['student_profile_id', 'guardian_profile_id']);
        });

        // Mỗi học sinh có đúng một người liên hệ chính. Partial unique index là cách duy
        // nhất diễn đạt quy tắc này ở tầng dữ liệu, và Blueprint không phát sinh được nó.
        DB::statement(
            'CREATE UNIQUE INDEX student_guardians_primary_unique ON student_guardians (student_profile_id) WHERE is_primary'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_guardians');
    }
};
