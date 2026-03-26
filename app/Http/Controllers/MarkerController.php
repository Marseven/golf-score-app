<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Group;
use App\Models\Score;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarkerController extends Controller
{
    public function login()
    {
        return Inertia::render('Marqueur/Login');
    }

    public function authenticate(Request $request)
    {
        $validated = $request->validate([
            'code' => 'nullable|string',
            'pin' => 'nullable|string|digits_between:4,6',
        ]);

        $group = null;

        if (! empty($validated['pin'])) {
            $group = Group::where('marker_pin', $validated['pin'])
                ->whereHas('tournament', fn ($q) => $q->whereIn('status', ['published', 'active']))
                ->first();

            if (! $group) {
                return back()->withErrors(['pin' => 'PIN invalide.']);
            }
        } elseif (! empty($validated['code'])) {
            $group = Group::where('code', $validated['code'])->first();

            if (! $group) {
                return back()->withErrors(['code' => 'Code de groupe invalide.']);
            }
        } else {
            return back()->withErrors(['code' => 'Veuillez saisir un PIN ou un code de groupe.']);
        }

        $request->session()->put('marker_group_id', $group->id);
        $request->session()->put('marker_group_code', $group->code);

        return redirect()->route('marqueur.scoring', $group);
    }

    public function scoring(Group $group)
    {
        $players = $group->players()->with('category')->get();
        $holes = $group->tournament->holes()->orderBy('number')->get();
        $scores = Score::whereIn('player_id', $players->pluck('id'))
            ->get()
            ->groupBy('player_id');

        return Inertia::render('Marqueur/Scoring', [
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

    public function scoringByToken(Request $request, string $token)
    {
        $group = Group::where('marker_token', $token)->firstOrFail();

        $request->session()->put('marker_group_id', $group->id);
        $request->session()->put('marker_group_code', $group->code);

        return redirect()->route('marqueur.scoring', $group);
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['marker_group_id', 'marker_group_code']);

        return redirect()->route('marqueur.login');
    }
}
