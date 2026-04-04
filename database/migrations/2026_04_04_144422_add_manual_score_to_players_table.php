<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->integer('manual_points')->nullable()->after('is_withdrawn');
            $table->decimal('playing_handicap', 4, 1)->nullable()->after('manual_points');
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn(['manual_points', 'playing_handicap']);
        });
    }
};
