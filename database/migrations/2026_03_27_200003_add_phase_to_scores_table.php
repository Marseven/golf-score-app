<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('scores', 'phase')) {
            Schema::table('scores', function (Blueprint $table) {
                $table->unsignedTinyInteger('phase')->default(1)->after('strokes');
            });
        }

        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite: drop old index and create new one
            // SQLite doesn't support DROP INDEX inside Schema::table, use raw
            DB::statement('DROP INDEX IF EXISTS scores_player_id_hole_id_unique');
            DB::statement('CREATE UNIQUE INDEX scores_player_id_hole_id_phase_unique ON scores (player_id, hole_id, phase)');
        } else {
            // MySQL: must drop foreign keys before dropping the unique index they depend on
            Schema::table('scores', function (Blueprint $table) {
                $table->dropForeign(['player_id']);
                $table->dropForeign(['hole_id']);
                $table->dropUnique(['player_id', 'hole_id']);
                $table->unique(['player_id', 'hole_id', 'phase']);
                $table->foreign('player_id')->references('id')->on('players')->onDelete('cascade');
                $table->foreign('hole_id')->references('id')->on('holes')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS scores_player_id_hole_id_phase_unique');
            DB::statement('CREATE UNIQUE INDEX scores_player_id_hole_id_unique ON scores (player_id, hole_id)');
        } else {
            Schema::table('scores', function (Blueprint $table) {
                $table->dropForeign(['player_id']);
                $table->dropForeign(['hole_id']);
                $table->dropUnique(['player_id', 'hole_id', 'phase']);
                $table->unique(['player_id', 'hole_id']);
                $table->foreign('player_id')->references('id')->on('players')->onDelete('cascade');
                $table->foreign('hole_id')->references('id')->on('holes')->onDelete('cascade');
            });
        }

        Schema::table('scores', function (Blueprint $table) {
            $table->dropColumn('phase');
        });
    }
};
