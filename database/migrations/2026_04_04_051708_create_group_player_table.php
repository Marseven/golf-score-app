<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_player', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('group_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('player_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['group_id', 'player_id']);
        });

        // Migrate existing group_id data to pivot table
        $players = DB::table('players')->whereNotNull('group_id')->get(['id', 'group_id']);
        foreach ($players as $player) {
            DB::table('group_player')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'group_id' => $player->group_id,
                'player_id' => $player->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_player');
    }
};
