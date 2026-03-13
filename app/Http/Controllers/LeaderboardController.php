<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function home()
    {
        return Inertia::render('Home');
    }

    public function tournamentList()
    {
        $tournaments = Tournament::where('status', 'active')
            ->withCount('players', 'groups')
            ->orderBy('date', 'desc')
            ->get();

        return Inertia::render('Tournaments', [
            'tournaments' => $tournaments,
        ]);
    }

    public function index(?Tournament $tournament = null)
    {
        $tournament = $tournament ?? Tournament::where('status', 'active')->latest()->first();

        if (!$tournament) {
            return Inertia::render('Classement', [
                'tournament' => null,
                'players' => [],
                'scores' => [],
                'holes' => [],
                'categories' => [],
            ]);
        }

        return Inertia::render('Classement', [
            'tournament' => $tournament,
            'players' => $tournament->players()->with('category')->get(),
            'scores' => $tournament->scores()->get(),
            'holes' => $tournament->holes()->orderBy('number')->get(),
            'categories' => $tournament->categories,
        ]);
    }

    public function tv(?Tournament $tournament = null)
    {
        $tournament = $tournament ?? Tournament::where('status', 'active')->latest()->first();

        if (!$tournament) {
            return Inertia::render('TvScreen', [
                'tournament' => null,
                'players' => [],
                'scores' => [],
                'holes' => [],
                'categories' => [],
            ]);
        }

        return Inertia::render('TvScreen', [
            'tournament' => $tournament,
            'players' => $tournament->players()->with('category')->get(),
            'scores' => $tournament->scores()->get(),
            'holes' => $tournament->holes()->orderBy('number')->get(),
            'categories' => $tournament->categories,
        ]);
    }
}
