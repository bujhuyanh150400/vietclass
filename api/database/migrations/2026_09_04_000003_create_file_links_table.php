<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the polymorphic usage links for managed files.
     */
    public function up(): void
    {
        Schema::create('file_links', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('file_id')->constrained('files')->restrictOnDelete();
            $table->smallInteger('type');
            $table->unsignedBigInteger('foreign_id');
            $table->timestampsTz();
            $table->index(['type', 'foreign_id']);
        });
    }

    /**
     * Remove the polymorphic usage links for managed files.
     */
    public function down(): void
    {
        Schema::dropIfExists('file_links');
    }
};
