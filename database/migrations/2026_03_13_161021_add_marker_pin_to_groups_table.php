<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->string('marker_pin', 6)->nullable()->after('marker_token');
            $table->unique(['tournament_id', 'marker_pin']);
        });

        // Backfill existing groups with unique PINs per tournament
        $groups = DB::table('groups')->orderBy('created_at')->get();
        $usedPins = []; // keyed by tournament_id

        foreach ($groups as $group) {
            $tournamentId = $group->tournament_id;
            if (! isset($usedPins[$tournamentId])) {
                $usedPins[$tournamentId] = [];
            }

            do {
                $pin = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            } while (in_array($pin, $usedPins[$tournamentId]));

            $usedPins[$tournamentId][] = $pin;

            $updateData = ['marker_pin' => $pin];

            // Backfill marker_token if missing
            if (empty($group->marker_token)) {
                $updateData['marker_token'] = Str::random(64);
            }

            DB::table('groups')
                ->where('id', $group->id)
                ->update($updateData);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropUnique(['tournament_id', 'marker_pin']);
            $table->dropColumn('marker_pin');
        });
    }
};
