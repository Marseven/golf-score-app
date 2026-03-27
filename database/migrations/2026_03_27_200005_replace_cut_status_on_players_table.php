<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->unsignedTinyInteger('cut_after_phase')->nullable()->after('registration_status');
        });

        // Migrate existing data: cut_status='cut' → cut_after_phase=1
        DB::table('players')
            ->where('cut_status', 'cut')
            ->update(['cut_after_phase' => 1]);

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('cut_status');
        });
    }

    public function down(): void
    {
        Schema::table('players', function (Blueprint $table) {
            $table->string('cut_status', 20)->default('active')->after('registration_status');
        });

        // Migrate back: cut_after_phase not null → cut_status='cut'
        DB::table('players')
            ->whereNotNull('cut_after_phase')
            ->update(['cut_status' => 'cut']);

        Schema::table('players', function (Blueprint $table) {
            $table->dropColumn('cut_after_phase');
        });
    }
};
