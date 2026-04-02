<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_marker', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('group_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('marker_pin', 6)->nullable();
            $table->timestamps();

            $table->unique(['group_id', 'user_id']);
        });

        // Migrate existing marker_id data to pivot table
        $groups = DB::table('groups')->whereNotNull('marker_id')->get();
        foreach ($groups as $group) {
            DB::table('group_marker')->insert([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'group_id' => $group->id,
                'user_id' => $group->marker_id,
                'marker_pin' => $group->marker_pin,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_marker');
    }
};
