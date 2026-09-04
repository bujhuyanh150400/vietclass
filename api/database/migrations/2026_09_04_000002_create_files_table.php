<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the owned file metadata store.
     */
    public function up(): void
    {
        Schema::create('files', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->restrictOnDelete();
            $table->string('original_name');
            $table->string('display_name');
            $table->string('disk');
            $table->string('path');
            $table->string('extension', 16);
            $table->string('mime_type', 150);
            $table->unsignedBigInteger('size_bytes');
            $table->softDeletesTz();
            $table->timestampsTz();
            $table->unique(['disk', 'path']);
            $table->index(['owner_user_id', 'deleted_at', 'created_at']);
        });
    }

    /**
     * Remove the owned file metadata store.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
