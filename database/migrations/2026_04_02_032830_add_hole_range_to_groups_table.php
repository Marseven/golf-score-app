<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->unsignedTinyInteger('hole_start')->default(1)->after('tee_date');
            $table->unsignedTinyInteger('hole_end')->default(18)->after('hole_start');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['hole_start', 'hole_end']);
        });
    }
};
