<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->foreignUuid('marker_id')->nullable()->after('tee_time')
                ->constrained('users')->onDelete('set null');
            $table->string('marker_token', 64)->nullable()->unique()->after('marker_id');
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['marker_id']);
            $table->dropColumn(['marker_id', 'marker_token']);
        });
    }
};
