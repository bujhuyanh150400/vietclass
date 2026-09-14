<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Trim existing descriptions to the newly enforced character limit.
     */
    public function up(): void
    {
        DB::table('subjects')
            ->whereRaw('char_length(description) > ?', [500])
            ->update(['description' => DB::raw('substring(description from 1 for 500)')]);
    }

    /**
     * Declare that truncated text cannot be reconstructed.
     */
    public function down(): void
    {
        // This data migration is intentionally irreversible.
    }
};
