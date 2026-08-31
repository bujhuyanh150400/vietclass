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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            // Sized to match classes.max_students rather than the fork's tinyint, so
            // the two capacity figures a scheduler compares share one range.
            $table->unsignedSmallInteger('capacity')->default(0);
            $table->text('note')->nullable();
            // 0 Hoạt động, 1 Tạm khóa, 2 Bảo trì (RoomStatus). Only an active room may
            // be assigned to a fixed schedule or a session.
            $table->smallInteger('status')->default(0)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
