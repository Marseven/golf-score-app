<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Create a default course for each tournament that has holes
        $tournamentIds = DB::table('holes')
            ->select('tournament_id')
            ->distinct()
            ->pluck('tournament_id');

        $courseMap = []; // tournament_id => course_id
        foreach ($tournamentIds as $tournamentId) {
            $courseId = Str::uuid()->toString();
            DB::table('courses')->insert([
                'id' => $courseId,
                'tournament_id' => $tournamentId,
                'name' => 'Parcours principal',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $courseMap[$tournamentId] = $courseId;
        }

        // Add course_id column to holes
        Schema::table('holes', function (Blueprint $table) {
            $table->uuid('course_id')->nullable()->after('tournament_id');
        });

        // Assign existing holes to their default course
        foreach ($courseMap as $tournamentId => $courseId) {
            DB::table('holes')
                ->where('tournament_id', $tournamentId)
                ->update(['course_id' => $courseId]);
        }

        // Add foreign key constraint
        Schema::table('holes', function (Blueprint $table) {
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
        });

        // Update unique constraint: tournament_id+number → course_id+number
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS holes_tournament_id_number_unique');
            DB::statement('CREATE UNIQUE INDEX holes_course_id_number_unique ON holes (course_id, number)');
        } else {
            // MySQL: the unique index backs the tournament_id FK, so we must
            // drop the FK first, then drop the unique, add the new unique,
            // and re-add a plain index for the FK.
            Schema::table('holes', function (Blueprint $table) {
                $table->dropForeign(['tournament_id']);
            });
            Schema::table('holes', function (Blueprint $table) {
                $table->dropUnique(['tournament_id', 'number']);
                $table->unique(['course_id', 'number']);
                $table->foreign('tournament_id')->references('id')->on('tournaments')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            DB::statement('DROP INDEX IF EXISTS holes_course_id_number_unique');
            DB::statement('CREATE UNIQUE INDEX holes_tournament_id_number_unique ON holes (tournament_id, number)');
        } else {
            Schema::table('holes', function (Blueprint $table) {
                $table->dropForeign(['tournament_id']);
            });
            Schema::table('holes', function (Blueprint $table) {
                $table->dropUnique(['course_id', 'number']);
                $table->unique(['tournament_id', 'number']);
                $table->foreign('tournament_id')->references('id')->on('tournaments')->onDelete('cascade');
            });
        }

        Schema::table('holes', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });

        // Remove default courses created by migration
        DB::table('courses')->where('name', 'Parcours principal')->delete();
    }
};
