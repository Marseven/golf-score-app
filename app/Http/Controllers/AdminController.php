<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Tournament;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();

        if ($isAdmin) {
            $tournaments = Tournament::withCount('players', 'groups')
                ->latest()
                ->get();
        } else {
            // Captain: only tournaments where user has a scoped role
            $tournamentIds = $user->roles()
                ->whereNotNull('tournament_id')
                ->pluck('tournament_id');

            $tournaments = Tournament::withCount('players', 'groups')
                ->whereIn('id', $tournamentIds)
                ->latest()
                ->get();
        }

        $tournamentIds = $tournaments->pluck('id');

        $stats = [
            'active_tournaments' => $tournaments->where('status', 'active')->count(),
            'total_players' => Player::whereIn('tournament_id', $tournamentIds)->count(),
            'total_groups' => Group::whereIn('tournament_id', $tournamentIds)->count(),
        ];

        if ($isAdmin) {
            $stats['pending_registrations'] = Player::whereIn('tournament_id', $tournamentIds)
                ->where('registration_status', 'pending')
                ->count();
            $stats['pending_payments'] = Payment::whereIn('tournament_id', $tournamentIds)
                ->where('status', 'pending')
                ->count();
        }

        return Inertia::render('Admin/Dashboard', [
            'tournaments' => $tournaments,
            'stats' => $stats,
            'isAdmin' => $isAdmin,
        ]);
    }
}
