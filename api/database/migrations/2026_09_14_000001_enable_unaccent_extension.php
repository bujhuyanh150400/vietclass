<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Install the `unaccent` dictionary so a search can match a Vietnamese name typed
     * without its tone marks.
     *
     * A teacher looking for "Nguyễn Văn Hùng" types "Hung": `ilike` compares the text
     * as stored, so the row never matches. `unaccent()` folds both sides down to plain
     * ASCII first — and the dictionary Postgres ships covers Vietnamese completely,
     * including `Đ` to `D`, which no naive `translate()` of the tone marks would.
     *
     * No index comes with it. Every search using this wraps its term as `%term%`, and a
     * leading wildcard rules out a btree index whether the column is folded or not, so
     * a functional index would cost writes and buy nothing. The day a search needs one,
     * it needs a `pg_trgm` GIN index, and that is when the `IMMUTABLE` wrapper this
     * deliberately skips becomes necessary.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');
    }

    /**
     * Remove the dictionary. Anything still calling `unaccent()` fails afterwards, so
     * this only reverses cleanly together with the queries that use it.
     */
    public function down(): void
    {
        DB::statement('DROP EXTENSION IF EXISTS unaccent');
    }
};
