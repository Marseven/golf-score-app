<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->renameColumn('manual_points', 'manual_points_r1');
        });
        Schema::table('players', function (Blueprint $table) {
            $table->integer('manual_points_r2')->nullable()->after('manual_points_r1');
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('manual_points_r2');
        });
        Schema::table('players', function (Blueprint $table) {
            $table->renameColumn('manual_points_r1', 'manual_points');
        });
    }
};
