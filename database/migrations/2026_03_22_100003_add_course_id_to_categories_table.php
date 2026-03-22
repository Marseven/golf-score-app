<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->uuid('course_id')->nullable()->after('tournament_id');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('set null');
        });

        // Link existing categories to their tournament's default course
        $categories = DB::table('categories')->get();
        foreach ($categories as $category) {
            $course = DB::table('courses')
                ->where('tournament_id', $category->tournament_id)
                ->first();
            if ($course) {
                DB::table('categories')
                    ->where('id', $category->id)
                    ->update(['course_id' => $course->id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn('course_id');
        });
    }
};
