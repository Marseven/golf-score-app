<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Tournament;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:10',
            'color' => 'required|string|max:50',
            'registration_fee' => 'numeric|min:0',
        ]);

        $tournament->categories()->create($validated);

        return back()->with('success', 'Catégorie ajoutée.');
    }

    public function update(Request $request, Tournament $tournament, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:10',
            'color' => 'required|string|max:50',
            'registration_fee' => 'numeric|min:0',
        ]);

        $category->update($validated);

        return back()->with('success', 'Catégorie mise à jour.');
    }

    public function destroy(Tournament $tournament, Category $category)
    {
        $category->delete();

        return back()->with('success', 'Catégorie supprimée.');
    }
}
