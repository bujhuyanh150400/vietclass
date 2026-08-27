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
        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->index()->constrained('classes');
            $table->foreignId('student_id')->index()->constrained();
            // NULL means the student pays the class base fee. Only the future finance
            // module writes this column.
            $table->decimal('fee_per_session', 12, 0)->nullable();
            $table->date('enrolled_at');
            $table->date('left_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            // Deliberately not unique: a student who left a class may enrol again as a
            // new row, which is how the enrolment history is preserved. "At most one
            // active enrolment" depends on the current date, so it cannot be expressed
            // as an immutable index predicate and is enforced in the Action instead.
            $table->index(['class_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_enrollments');
    }
};
