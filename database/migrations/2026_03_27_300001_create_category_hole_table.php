<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_hole', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->foreignUuid('hole_id')->constrained('holes')->onDelete('cascade');
            $table->unsignedTinyInteger('par');
            $table->timestamps();
            $table->unique(['category_id', 'hole_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_hole');
    }
};
