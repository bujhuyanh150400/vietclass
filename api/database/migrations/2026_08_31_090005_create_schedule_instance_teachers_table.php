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
        Schema::create('schedule_instance_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_instance_id')
                ->constrained('schedule_instances')->cascadeOnDelete();
            // The key stored here is the shared profile_id, so only somebody who holds
            // the teaching role has a row to reference.
            $table->foreignId('teacher_profile_id')->index()
                ->constrained('teacher_profiles', 'profile_id');
            // 0 Giáo viên chính, 1 Trợ giảng (ScheduleTeacherRole).
            $table->smallInteger('role');
            // Who this person stands in for. Role and substitution are two separate axes:
            // folding substitution into `role` could not express "an assistant covering
            // for somebody", which happens.
            $table->foreignId('replaces_profile_id')->nullable()
                ->constrained('teacher_profiles', 'profile_id');
            $table->timestamps();

            // One person appears at most once on a session. Named by hand: the generated
            // name is 73 bytes and PostgreSQL truncates at 63 silently.
            $table->unique(
                ['schedule_instance_id', 'teacher_profile_id'],
                'schedule_instance_teacher_unique',
            );
        });

        // Exactly one main teacher per session. A partial unique index is the only way to
        // state this rule at the data layer, and Blueprint cannot generate one; it is a
        // UNIQUE index, so it stays inside the ban on CHECK constraints. Same shape as
        // schedule_template_main_teacher_unique.
        DB::statement(
            'CREATE UNIQUE INDEX schedule_instance_main_teacher_unique ON schedule_instance_teachers (schedule_instance_id) WHERE role = 0'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_instance_teachers');
    }
};
