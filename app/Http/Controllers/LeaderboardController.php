<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Tournament;
use Illuminate\Support\Facades\DB;
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
                'cuts' => [],
                'categoryPars' => [],
            ]);
        }

        $categoryPars = DB::table('category_hole')
            ->whereIn('hole_id', $tournament->holes()->pluck('holes.id'))
            ->get(['category_id', 'hole_id', 'par']);

        return Inertia::render('Classement', [
            'tournament' => $tournament,
            'players' => fn () => $tournament->players()->with('category')->get(),
            'scores' => fn () => $tournament->scores()->get(),
            'holes' => $tournament->holes()->orderBy('number')->get(),
            'categories' => $tournament->categories,
            'cuts' => $tournament->cuts()->with('category')->get(),
            'categoryPars' => $categoryPars,
            'penalties' => fn () => $tournament->penalties()->get(['player_id', 'strokes', 'phase']),
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
                'cuts' => [],
                'categoryPars' => [],
                'logoUrl' => $logoUrl,
                'sponsorLogoUrl' => $sponsorLogoUrl,
            ]);
        }

        $categoryPars = DB::table('category_hole')
            ->whereIn('hole_id', $tournament->holes()->pluck('holes.id'))
            ->get(['category_id', 'hole_id', 'par']);

        return Inertia::render('TvScreen', [
            'tournament' => $tournament,
            'players' => fn () => $tournament->players()->with('category')->get(),
            'scores' => fn () => $tournament->scores()->get(),
            'holes' => $tournament->holes()->orderBy('number')->get(),
            'categories' => $tournament->categories,
            'cuts' => $tournament->cuts()->with('category')->get(),
            'categoryPars' => $categoryPars,
            'penalties' => fn () => $tournament->penalties()->get(['player_id', 'strokes', 'phase']),
            'logoUrl' => $logoUrl,
            'sponsorLogoUrl' => $sponsorLogoUrl,
        ]);
    }
}
