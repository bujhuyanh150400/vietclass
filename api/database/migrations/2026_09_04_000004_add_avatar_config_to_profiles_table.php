<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add optional avatar display configuration to profiles.
     */
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table): void {
            $table->jsonb('avatar_config')->nullable();
        });
    }

    /**
     * Remove optional avatar display configuration from profiles.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table): void {
            $table->dropColumn('avatar_config');
        });
    }
};
