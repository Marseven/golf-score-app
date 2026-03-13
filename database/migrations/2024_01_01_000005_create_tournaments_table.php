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
        Schema::create('tournaments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->date('date');
            $table->string('club');
            $table->enum('status', ['draft', 'active', 'finished'])->default('draft');
            $table->enum('scoring_mode', ['stroke_play', 'stableford', 'both'])->default('both');
            $table->text('rules')->nullable();
            $table->boolean('registration_open')->default(false);
            $table->decimal('registration_fee', 8, 2)->default(0);
            $table->string('registration_currency')->default('XAF');
            $table->foreignUuid('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
