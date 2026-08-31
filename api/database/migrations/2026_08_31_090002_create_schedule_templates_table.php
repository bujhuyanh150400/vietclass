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
        Schema::create('schedule_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes');
            // 0 Thứ 2 … 6 Chủ nhật (DayOfWeek). The fork used ISO 1–7; stored enums in
            // this system start at 0, and DayOfWeek::toIsoWeekday() bridges to Carbon.
            $table->smallInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            // Required: a class owns no room of its own for a schedule to inherit.
            $table->foreignId('room_id')->constrained('rooms');
            $table->date('start_date');
            // NULL means the schedule runs until the class ends; the projection is
            // bounded by classes.end_at rather than by a value written here.
            $table->date('end_date')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            // Reading one class's schedules over a date window, which is what the
            // projection does; it also answers a plain lookup by class_id.
            $table->index(['class_id', 'start_date', 'end_date']);
            // Room double-booking checks.
            $table->index(['room_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_templates');
    }
};
