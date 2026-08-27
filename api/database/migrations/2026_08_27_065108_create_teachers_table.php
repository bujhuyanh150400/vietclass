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
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            // One profile per login account. PostgreSQL does not index a foreign key
            // column on its own, and the unique constraint supplies that index here.
            $table->foreignId('user_id')->unique()->constrained();
            $table->string('full_name', 255);
            $table->string('phone', 20)->unique();
            $table->string('email', 255)->unique();
            $table->text('address')->nullable();
            // Payment details belong to the finance module that does not exist yet.
            // The columns are created so it needs no migration, and stay nullable
            // because no screen collects them in this release.
            $table->string('bank_bin', 20)->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_number', 30)->nullable();
            $table->string('bank_account_holder', 100)->nullable();
            $table->smallInteger('status')->default(0)->index();
            $table->string('color', 20)->nullable();
            $table->date('joined_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
