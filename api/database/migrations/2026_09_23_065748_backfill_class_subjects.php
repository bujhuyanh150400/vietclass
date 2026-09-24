<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Populate the full subject relation for existing single-subject classes.
     */
    public function up(): void
    {
        DB::statement('INSERT INTO class_subjects (class_id, subject_id, created_at, updated_at) SELECT id, subject_id, NOW(), NOW() FROM classes ON CONFLICT (class_id, subject_id) DO NOTHING');
    }

    /**
     * Preserve class-subject links on rollback; removing them would lose later edits.
     */
    public function down(): void
    {
        // Forward-only data migration: schema rollback removes the relation separately.
    }
};
