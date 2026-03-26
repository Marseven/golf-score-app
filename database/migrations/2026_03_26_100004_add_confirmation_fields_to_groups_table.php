<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->timestamp('scores_confirmed_at')->nullable()->after('marker_phone');
            $table->string('confirmed_by_name')->nullable()->after('scores_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['scores_confirmed_at', 'confirmed_by_name']);
        });
    }
};
