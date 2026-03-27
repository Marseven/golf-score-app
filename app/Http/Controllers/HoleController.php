<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HoleController extends Controller
{
    public function edit(Tournament $tournament)
    {
        return inertia('Admin/Holes/Edit', [
            'tournament' => $tournament,
            'holes' => $tournament->holes()->orderBy('number')->get(),
        ]);
    }

    public function update(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'holes' => 'required|array',
            'holes.*.id' => 'required|uuid|exists:holes,id',
            'holes.*.par' => 'required|integer|min:3|max:5',
            'holes.*.distance' => 'required|integer|min:0',
            'holes.*.hole_index' => 'required|integer|min:1|max:18',
        ]);

        foreach ($validated['holes'] as $holeData) {
            $tournament->holes()->where('id', $holeData['id'])->update([
                'par' => $holeData['par'],
                'distance' => $holeData['distance'],
                'hole_index' => $holeData['hole_index'],
            ]);
        }

        return back()->with('success', 'Parcours mis à jour.');
    }

    public function init(Tournament $tournament)
    {
        if ($tournament->holes()->count() === 0) {
            // Use first course or create a default one
            $course = $tournament->courses()->first();
            if (! $course) {
                $course = $tournament->courses()->create([
                    'name' => 'Parcours principal',
                ]);
            }

            for ($i = 1; $i <= 18; $i++) {
                $tournament->holes()->create([
                    'course_id' => $course->id,
                    'number' => $i,
                    'par' => 4,
                    'distance' => 0,
                    'hole_index' => $i,
                ]);
            }
        }

        return back()->with('success', 'Parcours initialisé.');
    }

    public function updateCategoryPars(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'category_pars' => 'required|array',
            'category_pars.*.category_id' => 'required|uuid|exists:categories,id',
            'category_pars.*.hole_id' => 'required|uuid|exists:holes,id',
            'category_pars.*.par' => 'required|integer|min:3|max:5',
        ]);

        $now = now();
        $rows = array_map(fn ($item) => [
            'id' => Str::uuid()->toString(),
            'category_id' => $item['category_id'],
            'hole_id' => $item['hole_id'],
            'par' => $item['par'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $validated['category_pars']);

        DB::table('category_hole')->upsert(
            $rows,
            ['category_id', 'hole_id'],
            ['par', 'updated_at']
        );

        return back()->with('success', 'Pars par catégorie mis à jour.');
    }
}
