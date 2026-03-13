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
        Schema::create('holes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tournament_id')->constrained('tournaments')->onDelete('cascade');
            $table->integer('number');
            $table->integer('par');
            $table->integer('distance')->default(0);
            $table->integer('hole_index')->default(0);
            $table->timestamps();

            $table->unique(['tournament_id', 'number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holes');
    }
};
