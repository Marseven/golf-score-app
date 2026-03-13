<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TournamentController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Tournaments/Index', [
            'tournaments' => Tournament::withCount('players', 'groups')->latest()->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Tournaments/Create');
    }

    public function show(Tournament $tournament)
    {
        $tournament->load([
            'categories',
            'groups.players.category',
            'groups.marker',
            'players.category',
            'players.group',
            'players.payments',
            'holes',
        ]);

        $scores = $tournament->scores()->with('hole')->get();
        $payments = $tournament->payments()->with('player')->get();

        $registrations = $tournament->players()
            ->whereIn('registration_status', ['pending', 'rejected'])
            ->orWhere(function ($q) use ($tournament) {
                $q->where('tournament_id', $tournament->id)
                    ->whereNotNull('email');
            })
            ->with('category', 'payments')
            ->get();

        $markers = User::whereHas('roles', fn ($q) => $q->where('role', 'marker')
            ->where(fn ($q2) => $q2->whereNull('tournament_id')->orWhere('tournament_id', $tournament->id))
        )->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Tournaments/Manage', [
            'tournament' => $tournament,
            'categories' => $tournament->categories,
            'players' => $tournament->players,
            'groups' => $tournament->groups,
            'holes' => $tournament->holes,
            'scores' => $scores,
            'registrations' => $registrations,
            'payments' => $payments,
            'markers' => $markers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'club' => 'required|string|max:255',
            'scoring_mode' => 'required|in:stroke_play,stableford,both',
            'rules' => 'nullable|string',
        ]);

        $tournament = Tournament::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        $tournament->syncStatus();

        // Create default categories
        $defaultCategories = [
            ['name' => 'Pro H', 'short_name' => 'PH', 'color' => 'blue'],
            ['name' => 'Pro F', 'short_name' => 'PF', 'color' => 'pink'],
            ['name' => 'Amateur H', 'short_name' => 'AH', 'color' => 'emerald'],
            ['name' => 'Amateur F', 'short_name' => 'AF', 'color' => 'violet'],
        ];

        foreach ($defaultCategories as $cat) {
            $tournament->categories()->create($cat);
        }

        // Create default 18 holes
        for ($i = 1; $i <= 18; $i++) {
            $tournament->holes()->create([
                'number' => $i,
                'par' => 4,
                'distance' => 0,
                'hole_index' => $i,
            ]);
        }

        return redirect()->route('tournaments.show', $tournament)->with('success', 'Tournoi créé avec succès.');
    }

    public function edit(Tournament $tournament)
    {
        return Inertia::render('Admin/Tournaments/Edit', [
            'tournament' => $tournament->load('categories'),
        ]);
    }

    public function update(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'club' => 'required|string|max:255',
            'status' => 'required|in:draft,published,active,finished',
            'scoring_mode' => 'required|in:stroke_play,stableford,both',
            'rules' => 'nullable|string',
            'registration_open' => 'boolean',
            'registration_fee' => 'numeric|min:0',
            'registration_currency' => 'string|max:3',
        ]);

        $tournament->update($validated);
        $tournament->syncStatus();

        return back()->with('success', 'Tournoi mis à jour.');
    }

    public function togglePublish(Tournament $tournament)
    {
        $isPublished = in_array($tournament->status, ['published', 'active']);
        $newStatus = $isPublished ? 'draft' : 'published';
        $tournament->update(['status' => $newStatus]);
        $tournament->syncStatus();

        $message = $isPublished ? 'Tournoi dépublié.' : 'Tournoi publié.';

        return back()->with('success', $message);
    }

    public function destroy(Tournament $tournament)
    {
        $tournament->delete();

        return redirect()->route('admin.dashboard')->with('success', 'Tournoi supprimé.');
    }
}
