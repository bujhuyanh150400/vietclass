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
        Schema::create('feature_user', function (Blueprint $table) {
            $table->id();
            // PostgreSQL does not index a foreign key column on its own, and
            // `constrained()` only adds the constraint, so both are indexed here.
            $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();
            $table->foreignId('feature_id')->index()->constrained()->cascadeOnDelete();
            $table->boolean('granted')->default(true);
            $table->timestamps();
            $table->unique(['user_id', 'feature_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feature_user');
    }
};
