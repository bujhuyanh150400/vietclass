<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Create the append-only history for enrollment periods. */
    public function up(): void
    {
        Schema::create('class_enrollment_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('class_enrollment_id')->constrained('class_enrollments')->restrictOnDelete();
            $table->foreignId('related_enrollment_id')->nullable()->constrained('class_enrollments')->restrictOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->smallInteger('event_type');
            $table->date('effective_on');
            $table->text('note')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestampsTz();

            $table->index('class_enrollment_id');
            $table->index('related_enrollment_id');
            $table->index(['class_enrollment_id', 'created_at']);
            $table->index('event_type');
        });

        DB::statement('ALTER TABLE class_enrollment_events ADD CONSTRAINT class_enrollment_events_event_type_check CHECK (event_type BETWEEN 0 AND 5)');

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION prevent_class_enrollment_event_mutation() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'class enrollment events are immutable';
            END;
            $$ LANGUAGE plpgsql
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER class_enrollment_events_immutable
            BEFORE UPDATE OR DELETE ON class_enrollment_events
            FOR EACH ROW EXECUTE FUNCTION prevent_class_enrollment_event_mutation()
        SQL);
    }

    /** Remove the event log and its immutability trigger. */
    public function down(): void
    {
        Schema::dropIfExists('class_enrollment_events');
        DB::unprepared('DROP FUNCTION IF EXISTS prevent_class_enrollment_event_mutation()');
    }
};
