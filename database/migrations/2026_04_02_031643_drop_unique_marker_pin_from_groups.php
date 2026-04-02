<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Must add a regular index on tournament_id first so the FK can use it,
        // then drop the unique index
        DB::statement('ALTER TABLE `groups` ADD INDEX `groups_tournament_id_index` (`tournament_id`)');
        DB::statement('ALTER TABLE `groups` DROP INDEX `groups_tournament_id_marker_pin_unique`');
        DB::statement('ALTER TABLE `groups` ADD INDEX `groups_tournament_id_marker_pin_index` (`tournament_id`, `marker_pin`)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `groups` DROP INDEX `groups_tournament_id_marker_pin_index`');
        DB::statement('ALTER TABLE `groups` DROP INDEX `groups_tournament_id_index`');
        DB::statement('ALTER TABLE `groups` ADD UNIQUE `groups_tournament_id_marker_pin_unique` (`tournament_id`, `marker_pin`)');
    }
};
