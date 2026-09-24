<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Copy legacy representative subjects, lead teachers, and assistants into the normalized relations.
     */
    public function up(): void
    {
        DB::statement(<<<'SQL'
            INSERT INTO class_subjects (class_id, subject_id, is_primary, created_at, updated_at)
            SELECT id, subject_id, TRUE, created_at, updated_at
            FROM classes
            ON CONFLICT (class_id, subject_id) DO UPDATE SET is_primary = TRUE
        SQL);

        DB::statement(<<<'SQL'
            INSERT INTO class_teachers (class_id, teacher_id, is_primary, created_at, updated_at)
            SELECT id, teacher_id, TRUE, created_at, updated_at
            FROM classes
            ON CONFLICT (class_id, teacher_id) DO UPDATE SET is_primary = TRUE
        SQL);

        DB::statement(<<<'SQL'
            INSERT INTO class_teachers (class_id, teacher_id, is_primary, created_at, updated_at)
            SELECT class_id, teacher_id, FALSE, created_at, updated_at
            FROM class_assistant_teachers
            ON CONFLICT (class_id, teacher_id) DO NOTHING
        SQL);
    }

    /**
     * Recreate legacy class assignments and the assistant links before normalized storage is removed.
     */
    public function down(): void
    {
        DB::statement(<<<'SQL'
            UPDATE classes AS c
            SET subject_id = cs.subject_id
            FROM class_subjects AS cs
            WHERE cs.class_id = c.id AND cs.is_primary
        SQL);

        DB::statement(<<<'SQL'
            UPDATE classes AS c
            SET teacher_id = ct.teacher_id
            FROM class_teachers AS ct
            WHERE ct.class_id = c.id AND ct.is_primary
        SQL);

        DB::statement(<<<'SQL'
            INSERT INTO class_assistant_teachers (class_id, teacher_id, created_at, updated_at)
            SELECT class_id, teacher_id, created_at, updated_at
            FROM class_teachers
            WHERE NOT is_primary
            ON CONFLICT (class_id, teacher_id) DO NOTHING
        SQL);
    }
};
