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
        Schema::create('schedule_template_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_template_id')
                ->constrained('schedule_templates')->cascadeOnDelete();
            // The key stored here is the shared profile_id, so only somebody who holds
            // the teaching role has a row to reference.
            $table->foreignId('teacher_profile_id')->index()
                ->constrained('teacher_profiles', 'profile_id');
            // 0 Giáo viên chính, 1 Trợ giảng (ScheduleTeacherRole).
            $table->smallInteger('role');
            $table->timestamps();

            // One person appears at most once on a schedule. Named by hand: the
            // generated name is 73 bytes and PostgreSQL truncates at 63 silently.
            $table->unique(
                ['schedule_template_id', 'teacher_profile_id'],
                'schedule_template_teacher_unique',
            );
        });

        // Exactly one main teacher per schedule. A partial unique index is the only way
        // to state this rule at the data layer, and Blueprint cannot generate one; it is
        // a UNIQUE index, so it stays inside the ban on CHECK constraints. Same shape as
        // the student_guardians primary-contact index.
        DB::statement(
            'CREATE UNIQUE INDEX schedule_template_main_teacher_unique ON schedule_template_teachers (schedule_template_id) WHERE role = 0'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_template_teachers');
    }
};
