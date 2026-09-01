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
        Schema::create('schedule_instances', function (Blueprint $table) {
            $table->id();
            // Nullable: a pooled make-up or an extra session need not belong to a class.
            $table->foreignId('class_id')->nullable()->constrained('classes');
            // Nullable: a session that nobody's weekly schedule produced has no template.
            // The companion rule "template_id set implies class_id set" lives in the
            // Actions, not in a CHECK constraint.
            $table->foreignId('template_id')->nullable()->constrained('schedule_templates');
            // Denormalised on purpose: a session outside any class still has to say which
            // subject is being taught.
            $table->foreignId('subject_id')->constrained('subjects');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->foreignId('room_id')->constrained('rooms');
            // 0 Lịch chính, 1 Học bù, 2 Tăng cường (ScheduleType).
            $table->smallInteger('schedule_type')->default(0);
            // 0 Chưa diễn ra, 1 Đã diễn ra, 2 Đã huỷ (ScheduleStatus).
            $table->smallInteger('status')->default(0);
            // The cancelled session this one makes up for. Unique, so a cancelled session
            // has at most one make-up; the fork spelled out a redundant
            // `WHERE ... IS NOT NULL` that NULL-distinctness already gives.
            $table->foreignId('linked_makeup_for')->nullable()->unique()
                ->constrained('schedule_instances');
            // Somebody deliberately touched this session; no automatic operation may
            // overwrite or remove it afterwards.
            $table->boolean('is_customized')->default(false);
            $table->text('note')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            // The keystone of the projection model: it makes materialising one projected
            // session idempotent, so resolving the same (schedule, date) twice cannot
            // produce a second row. NULLs are distinct in PostgreSQL, so sessions that
            // belong to no fixed schedule are unaffected.
            $table->unique(['template_id', 'date']);

            // Reading the calendar over a date range with no other filter, which is the
            // default request; an earlier draft of this design had no index for it.
            $table->index(['date', 'start_time']);
            // One class's calendar.
            $table->index(['class_id', 'date']);
            // Room double-booking checks.
            $table->index(['room_id', 'date', 'start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_instances');
    }
};
