<?php

namespace App\Http\Controllers;

use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Tournament $tournament)
    {
        return Inertia::render('Admin/Registrations', [
            'tournament' => $tournament,
            'players' => $tournament->players()
                ->where('registration_status', '!=', 'approved')
                ->orWhere(function ($q) use ($tournament) {
                    $q->where('tournament_id', $tournament->id)
                        ->whereNotNull('email');
                })
                ->with('category', 'payments')
                ->get(),
        ]);
    }

    public function create(Tournament $tournament)
    {
        if (! $tournament->registration_open) {
            abort(403, 'Les inscriptions sont fermées.');
        }

        return Inertia::render('Registration/Create', [
            'tournament' => $tournament->only('id', 'name', 'start_date', 'end_date', 'club', 'registration_currency'),
            'categories' => $tournament->categories,
        ]);
    }

    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'handicap' => 'numeric|min:0|max:54',
            'category_id' => 'required|uuid|exists:categories,id',
        ]);

        $player = $tournament->players()->create([
            ...$validated,
            'registration_status' => 'pending',
        ]);

        $category = $tournament->categories()->find($validated['category_id']);
        $fee = $category ? $category->registration_fee : 0;

        if ($fee > 0) {
            return redirect()->route('paiement.create', [$tournament, $player]);
        }

        return redirect()->route('classement')->with('success', 'Inscription enregistrée. En attente de validation.');
    }

    public function update(Request $request, Tournament $tournament, Player $player)
    {
        $validated = $request->validate([
            'registration_status' => 'required|in:approved,rejected',
        ]);

        $player->update($validated);

        return back()->with('success', 'Statut mis à jour.');
    }
}
