<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Create one default profile for every account that does not yet have one.
     */
    public function up(): void
    {
        $timestamp = now();

        DB::table('profiles')->insertUsing(
            ['user_id', 'full_name', 'gender', 'metadata', 'created_at', 'updated_at'],
            DB::table('users')
                ->leftJoin('profiles', 'profiles.user_id', '=', 'users.id')
                ->whereNull('profiles.user_id')
                ->selectRaw("users.id, users.username, 2, '{}'::jsonb, ?, ?", [$timestamp, $timestamp]),
        );
    }

    /**
     * Preserve backfilled profile data when rolling back this migration.
     */
    public function down(): void
    {
        // Deliberately irreversible: a rollback must never delete user profile data.
    }
};
