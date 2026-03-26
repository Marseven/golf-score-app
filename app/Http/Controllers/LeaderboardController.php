<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Tournament;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LeaderboardController extends Controller
{
    public function home()
    {
        return Inertia::render('Home');
    }

    public function tournamentList()
    {
        $tournaments = Tournament::whereIn('status', ['published', 'active'])
            ->withCount('players', 'groups')
            ->orderBy('start_date', 'desc')
            ->get();

        return Inertia::render('Tournaments', [
            'tournaments' => $tournaments,
        ]);
    }

    public function index(?Tournament $tournament = null)
    {
        $tournament = $tournament ?? Tournament::where('status', 'active')->latest()->first();

        if (! $tournament) {
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

        $logoPath = Setting::getValue('logo_path');
        $sponsorLogoPath = Setting::getValue('sponsor_logo_path');
        $logoUrl = $logoPath ? Storage::disk('public')->url($logoPath) : null;
        $sponsorLogoUrl = $sponsorLogoPath ? Storage::disk('public')->url($sponsorLogoPath) : null;

        if (! $tournament) {
            return Inertia::render('TvScreen', [
                'tournament' => null,
                'players' => [],
                'scores' => [],
                'holes' => [],
                'categories' => [],
                'logoUrl' => $logoUrl,
                'sponsorLogoUrl' => $sponsorLogoUrl,
            ]);
        }

        return Inertia::render('TvScreen', [
            'tournament' => $tournament,
            'players' => $tournament->players()->with('category')->get(),
            'scores' => $tournament->scores()->get(),
            'holes' => $tournament->holes()->orderBy('number')->get(),
            'categories' => $tournament->categories,
            'logoUrl' => $logoUrl,
            'sponsorLogoUrl' => $sponsorLogoUrl,
        ]);
    }
}
