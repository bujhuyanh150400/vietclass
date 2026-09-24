<?php

use App\Modules\Academic\Models\Subject;
use App\Modules\Academic\Models\TeacherProfile;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('class assignments use normalized tables with unique pairs, foreign keys, and one primary maximum', function () {
    expect(Schema::hasColumns('class_subjects', ['class_id', 'subject_id', 'is_primary']))->toBeTrue()
        ->and(Schema::hasColumns('class_teachers', ['class_id', 'teacher_id', 'is_primary']))->toBeTrue()
        ->and(Schema::hasColumn('classes', 'subject_id'))->toBeFalse()
        ->and(Schema::hasColumn('classes', 'teacher_id'))->toBeFalse()
        ->and(Schema::hasTable('class_assistant_teachers'))->toBeFalse();

    $indexes = collect(DB::select(<<<'SQL'
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename IN ('class_subjects', 'class_teachers')
    SQL))->keyBy('indexname');

    expect(strtolower($indexes['class_subjects_class_id_subject_id_unique']->indexdef))->toContain('(class_id, subject_id)')
        ->and(strtolower($indexes['class_teachers_class_id_teacher_id_unique']->indexdef))->toContain('(class_id, teacher_id)')
        ->and(strtolower($indexes['class_subjects_one_primary_per_class_unique']->indexdef))->toContain('where is_primary')
        ->and(strtolower($indexes['class_teachers_one_primary_per_class_unique']->indexdef))->toContain('where is_primary');

    $foreignKeys = collect(DB::select(<<<'SQL'
        SELECT conname, lower(pg_get_constraintdef(oid)) AS definition
        FROM pg_constraint
        WHERE conrelid = to_regclass(?) AND contype = 'f'
    SQL, ['class_subjects']))->pluck('definition')->implode(' ');

    expect($foreignKeys)->toContain('foreign key (class_id) references classes(id) on delete cascade')
        ->and($foreignKeys)->toContain('foreign key (subject_id) references subjects(id) on delete restrict');

    $teacherForeignKeys = collect(DB::select(<<<'SQL'
        SELECT lower(pg_get_constraintdef(oid)) AS definition
        FROM pg_constraint
        WHERE conrelid = to_regclass(?) AND contype = 'f'
    SQL, ['class_teachers']))->pluck('definition')->implode(' ');

    expect($teacherForeignKeys)->toContain('foreign key (class_id) references classes(id) on delete cascade')
        ->and($teacherForeignKeys)->toContain('foreign key (teacher_id) references teacher_profiles(profile_id) on delete restrict');
});

test('relationship backfill preserves existing sets and rollback restores the legacy columns and assistants', function () {
    $primarySubject = Subject::factory()->create();
    $additionalSubject = Subject::factory()->create();
    $lead = TeacherProfile::factory()->create();
    $assistant = TeacherProfile::factory()->create();
    $now = now()->toDateTimeString();

    Schema::table('classes', function (Blueprint $table) {
        $table->foreignId('subject_id')->nullable()->constrained('subjects');
        $table->foreignId('teacher_id')->nullable()->constrained('teacher_profiles', 'profile_id');
    });

    $classId = DB::table('classes')->insertGetId([
        'code' => 'SCHEMA-BACKFILL',
        'name' => 'Schema test class',
        'subject_id' => $primarySubject->id,
        'teacher_id' => $lead->profile_id,
        'grade_level' => 9,
        'max_students' => 20,
        'status' => 0,
        'start_at' => now()->toDateString(),
        'created_at' => $now,
        'updated_at' => $now,
    ]);

    DB::table('class_subjects')->insert([
        'class_id' => $classId,
        'subject_id' => $additionalSubject->id,
        'is_primary' => false,
        'created_at' => $now,
        'updated_at' => $now,
    ]);

    Schema::create('class_assistant_teachers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
        $table->foreignId('teacher_id')->constrained('teacher_profiles', 'profile_id')->restrictOnDelete();
        $table->unique(['class_id', 'teacher_id']);
        $table->index('teacher_id');
        $table->timestamps();
    });

    DB::table('class_assistant_teachers')->insert([
        ['class_id' => $classId, 'teacher_id' => $assistant->profile_id, 'created_at' => $now, 'updated_at' => $now],
        ['class_id' => $classId, 'teacher_id' => $lead->profile_id, 'created_at' => $now, 'updated_at' => $now],
    ]);

    $backfill = require database_path('migrations/2026_09_23_081300_backfill_class_relationships.php');
    $backfill->up();

    expect(DB::table('class_subjects')->where('class_id', $classId)->where('is_primary', true)->value('subject_id'))
        ->toBe($primarySubject->id)
        ->and(DB::table('class_subjects')->where('class_id', $classId)->where('subject_id', $additionalSubject->id)->value('is_primary'))
        ->toBeFalse()
        ->and(DB::table('class_teachers')->where('class_id', $classId)->where('teacher_id', $lead->profile_id)->value('is_primary'))
        ->toBeTrue()
        ->and(DB::table('class_teachers')->where('class_id', $classId)->where('teacher_id', $assistant->profile_id)->value('is_primary'))
        ->toBeFalse()
        ->and(DB::table('class_teachers')->where('class_id', $classId)->count())
        ->toBe(2);

    $normalize = require database_path('migrations/2026_09_23_081301_normalize_class_relationship_storage.php');
    $normalize->up();

    expect(Schema::hasColumn('classes', 'subject_id'))->toBeFalse()
        ->and(Schema::hasColumn('classes', 'teacher_id'))->toBeFalse()
        ->and(Schema::hasTable('class_assistant_teachers'))->toBeFalse();

    $normalize->down();
    $backfill->down();
    $primarySchema = require database_path('migrations/2026_09_23_081259_add_primary_flags_and_create_class_teachers_table.php');
    $primarySchema->down();

    expect(DB::table('classes')->where('id', $classId)->value('subject_id'))->toBe($primarySubject->id)
        ->and(DB::table('classes')->where('id', $classId)->value('teacher_id'))->toBe($lead->profile_id)
        ->and(DB::table('class_assistant_teachers')->where('class_id', $classId)->where('teacher_id', $assistant->profile_id)->exists())
        ->toBeTrue()
        ->and(DB::table('class_assistant_teachers')->where('class_id', $classId)->where('teacher_id', $lead->profile_id)->exists())
        ->toBeFalse()
        ->and(Schema::hasTable('class_teachers'))
        ->toBeFalse()
        ->and(Schema::hasColumn('class_subjects', 'is_primary'))
        ->toBeFalse();
});
