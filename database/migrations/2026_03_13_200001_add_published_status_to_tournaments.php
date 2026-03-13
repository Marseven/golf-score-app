<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SQLite stores enum as CHECK constraints. We must rebuild the table
     * to add 'published' to the allowed status values.
     */
    public function up(): void
    {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert any 'published' rows back to 'draft' before restoring the constraint
        DB::statement("UPDATE \"tournaments\" SET \"status\" = 'draft' WHERE \"status\" = 'published'");

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
    }
};
