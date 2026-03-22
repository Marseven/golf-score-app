<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Tournament;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $course = $tournament->courses()->create($validated);

        // Create default 18 holes for the new course
        for ($i = 1; $i <= 18; $i++) {
            $tournament->holes()->create([
                'course_id' => $course->id,
                'number' => $i,
                'par' => 4,
                'distance' => 0,
                'hole_index' => $i,
            ]);
        }

        return back()->with('success', 'Parcours "'.$course->name.'" créé.');
    }

    public function update(Request $request, Tournament $tournament, Course $course)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $course->update($validated);

        return back()->with('success', 'Parcours mis à jour.');
    }

    public function destroy(Tournament $tournament, Course $course)
    {
        // Don't allow deleting the last course
        if ($tournament->courses()->count() <= 1) {
            return back()->with('error', 'Impossible de supprimer le dernier parcours.');
        }

        $course->delete();

        return back()->with('success', 'Parcours supprimé.');
    }
}
