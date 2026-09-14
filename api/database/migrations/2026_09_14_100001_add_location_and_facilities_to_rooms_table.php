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
        Schema::table('rooms', function (Blueprint $table): void {
            $table->text('location')->nullable();
            // Not nullable with an empty-array default, so a room always answers with a
            // list and no reader needs a null branch. Holds ClassroomFacility integers.
            $table->jsonb('facilities')->default(DB::raw("'[]'::jsonb"));
        });

        // Only the containment operator `@>` is ever used against this column, and
        // jsonb_path_ops builds a smaller, faster index than the default jsonb_ops for
        // exactly that operator. The operator class cannot be expressed through the
        // schema builder, so the index is stated in raw SQL.
        DB::statement('create index rooms_facilities_gin_index on rooms using gin (facilities jsonb_path_ops)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('drop index if exists rooms_facilities_gin_index');

        Schema::table('rooms', function (Blueprint $table): void {
            $table->dropColumn(['location', 'facilities']);
        });
    }
};
