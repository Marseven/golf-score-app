<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Group;
use App\Models\Score;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CaddyMasterController extends Controller
{
    public function login()
    {
        return Inertia::render('CaddyMaster/Login');
    }

    public function authenticate(Request $request)
    {
        $validated = $request->validate([
            'pin' => 'required|string|digits:6',
        ]);

        $tournament = Tournament::where('caddie_master_pin', $validated['pin'])
            ->whereIn('status', ['published', 'active'])
            ->first();

        if (! $tournament) {
            return back()->withErrors(['pin' => 'PIN invalide.']);
        }

        $request->session()->put('caddie_master_tournament_id', $tournament->id);

        return redirect()->route('caddie-master.dashboard');
    }

    public function dashboard(Request $request)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        $tournament = Tournament::findOrFail($tournamentId);

        $groups = $tournament->groups()
            ->with(['players.category', 'players.scores'])
            ->orderBy('tee_time')
            ->get();

        $holes = $tournament->holes()->orderBy('number')->get();
        $holesCount = $holes->count();

        $groups->each(function ($group) use ($holesCount) {
            $playerCount = $group->players->count();
            $scoredCount = $group->players->sum(fn ($p) => $p->scores->count());
            $totalExpected = $playerCount * $holesCount;
            $group->scoring_progress = $totalExpected > 0
                ? round(($scoredCount / $totalExpected) * 100)
                : 0;
        });

        return Inertia::render('CaddyMaster/Dashboard', [
            'tournament' => $tournament,
            'groups' => $groups,
            'holes' => $holes,
        ]);
    }

    public function scoring(Request $request, Group $group)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        if ($group->tournament_id !== $tournamentId) {
            abort(403);
        }

        $players = $group->players()->with('category')->get();
        $holes = $group->tournament->holes()->orderBy('number')->get();
        $scores = Score::whereIn('player_id', $players->pluck('id'))
            ->get()
            ->groupBy('player_id');

        return Inertia::render('CaddyMaster/Scoring', [
            'group' => $group,
            'groupCode' => $group->code,
            'players' => $players,
            'holes' => $holes,
            'existingScores' => $scores,
            'tournamentId' => $group->tournament_id,
        ]);
    }

    public function saveScores(Request $request, Group $group)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        if ($group->tournament_id !== $tournamentId) {
            abort(403);
        }

        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.player_id' => 'required|uuid|exists:players,id',
            'scores.*.hole_id' => 'required|uuid|exists:holes,id',
            'scores.*.strokes' => 'required|integer|min:1',
        ]);

        foreach ($validated['scores'] as $scoreData) {
            Score::updateOrCreate(
                [
                    'player_id' => $scoreData['player_id'],
                    'hole_id' => $scoreData['hole_id'],
                ],
                [
                    'strokes' => $scoreData['strokes'],
                    'synced' => true,
                ]
            );
        }

        broadcast(new ScoreUpdated($group->tournament_id))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Scores enregistrés.');
    }

    public function confirmScores(Request $request, Group $group)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        if ($group->tournament_id !== $tournamentId) {
            abort(403);
        }

        $validated = $request->validate([
            'confirmed_by_name' => 'required|string|max:255',
        ]);

        $group->update([
            'scores_confirmed_at' => now(),
            'confirmed_by_name' => $validated['confirmed_by_name'],
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Scores confirmés.');
    }

    public function logout(Request $request)
    {
        $request->session()->forget('caddie_master_tournament_id');

        return redirect()->route('caddie-master.login');
    }
}
