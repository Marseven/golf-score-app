<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds 'published' to the allowed status values.
     * SQLite requires table rebuild (CHECK constraint), MySQL/MariaDB uses ENUM or just varchar.
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE "tournaments_new" (
                    "id" varchar NOT NULL,
                    "name" varchar NOT NULL,
                    "start_date" date NOT NULL,
                    "club" varchar NOT NULL,
                    "status" varchar CHECK ("status" IN (\'draft\', \'published\', \'active\', \'finished\')) NOT NULL DEFAULT \'draft\',
                    "scoring_mode" varchar CHECK ("scoring_mode" IN (\'stroke_play\', \'stableford\', \'both\')) NOT NULL DEFAULT \'both\',
                    "rules" text,
                    "registration_open" tinyint(1) NOT NULL DEFAULT \'0\',
                    "registration_fee" numeric NOT NULL DEFAULT \'0\',
                    "registration_currency" varchar NOT NULL DEFAULT \'XAF\',
                    "created_by" varchar,
                    "created_at" datetime,
                    "updated_at" datetime,
                    "end_date" date,
                    FOREIGN KEY("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
                    PRIMARY KEY ("id")
                )
            ');

            DB::statement('INSERT INTO "tournaments_new" SELECT * FROM "tournaments"');
            DB::statement('DROP TABLE "tournaments"');
            DB::statement('ALTER TABLE "tournaments_new" RENAME TO "tournaments"');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'published', 'active', 'finished') NOT NULL DEFAULT 'draft'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        DB::statement("UPDATE \"tournaments\" SET \"status\" = 'draft' WHERE \"status\" = 'published'");

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');

            DB::statement('
                CREATE TABLE "tournaments_old" (
                    "id" varchar NOT NULL,
                    "name" varchar NOT NULL,
                    "start_date" date NOT NULL,
                    "club" varchar NOT NULL,
                    "status" varchar CHECK ("status" IN (\'draft\', \'active\', \'finished\')) NOT NULL DEFAULT \'draft\',
                    "scoring_mode" varchar CHECK ("scoring_mode" IN (\'stroke_play\', \'stableford\', \'both\')) NOT NULL DEFAULT \'both\',
                    "rules" text,
                    "registration_open" tinyint(1) NOT NULL DEFAULT \'0\',
                    "registration_fee" numeric NOT NULL DEFAULT \'0\',
                    "registration_currency" varchar NOT NULL DEFAULT \'XAF\',
                    "created_by" varchar,
                    "created_at" datetime,
                    "updated_at" datetime,
                    "end_date" date,
                    FOREIGN KEY("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
                    PRIMARY KEY ("id")
                )
            ');

            DB::statement('INSERT INTO "tournaments_old" SELECT * FROM "tournaments"');
            DB::statement('DROP TABLE "tournaments"');
            DB::statement('ALTER TABLE "tournaments_old" RENAME TO "tournaments"');

            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement("ALTER TABLE tournaments MODIFY COLUMN status ENUM('draft', 'active', 'finished') NOT NULL DEFAULT 'draft'");
        }
    }
};
