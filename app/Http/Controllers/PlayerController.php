<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\Player;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'handicap' => 'numeric|min:0|max:54',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'group_id' => 'nullable|uuid|exists:groups,id',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
        ]);

        $tournament->players()->create($validated);

        return back()->with('success', 'Joueur ajouté.');
    }

    public function update(Request $request, Tournament $tournament, Player $player)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'handicap' => 'numeric|min:0|max:54',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'group_id' => 'nullable|uuid|exists:groups,id',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
        ]);

        $player->update($validated);

        return back()->with('success', 'Joueur mis à jour.');
    }

    public function destroy(Tournament $tournament, Player $player)
    {
        $player->delete();

        return back()->with('success', 'Joueur supprimé.');
    }
}
