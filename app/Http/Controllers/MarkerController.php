<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Group;
use App\Models\Player;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        if (! empty($validated['pin'])) {
            // Try to find a group by PIN
            $group = Group::where('marker_pin', $validated['pin'])
                ->whereHas('tournament', fn ($q) => $q->whereIn('status', ['published', 'active']))
                ->first();

            if ($group) {
                // Store the marker context: all groups this marker handles
                $markerGroups = Group::where('marker_pin', $validated['pin'])
                    ->whereHas('tournament', fn ($q) => $q->whereIn('status', ['published', 'active']))
                    ->pluck('id')
                    ->toArray();

                $request->session()->put('marker_group_ids', $markerGroups);
                $request->session()->put('marker_tournament_id', $group->tournament_id);

                if (count($markerGroups) === 1) {
                    $request->session()->put('marker_group_id', $group->id);
                    $request->session()->put('marker_group_code', $group->code);
                    return redirect()->route('marqueur.scoring', $group);
                }

                return redirect()->route('marqueur.groups');
            }

            return back()->withErrors(['pin' => 'PIN invalide.']);
        }

        if (! empty($validated['code'])) {
            $group = Group::where('code', $validated['code'])
                ->whereHas('tournament', fn ($q) => $q->whereIn('status', ['published', 'active']))
                ->first();

            if (! $group) {
                return back()->withErrors(['code' => 'Code de groupe invalide.']);
            }

            $request->session()->put('marker_group_ids', [$group->id]);
            $request->session()->put('marker_group_id', $group->id);
            $request->session()->put('marker_group_code', $group->code);
            $request->session()->put('marker_tournament_id', $group->tournament_id);

            return redirect()->route('marqueur.scoring', $group);
        }

        return back()->withErrors(['code' => 'Veuillez saisir un PIN ou un code de groupe.']);
    }

    public function groups(Request $request)
    {
        $groupIds = $request->session()->get('marker_group_ids', []);

        if (empty($groupIds)) {
            return redirect()->route('marqueur.login');
        }

        $groups = Group::whereIn('id', $groupIds)
            ->with(['players.category', 'category', 'course', 'tournament'])
            ->orderBy('tee_time')
            ->get();

        // Calculate scoring progress for each group based on marker's hole range
        $groups->each(function ($group) {
            $playerCount = $group->players->count();

            // Get hole range from the marker user
            $holeStart = 1;
            $holeEnd = 18;
            if ($group->marker_id) {
                $marker = \App\Models\User::find($group->marker_id);
                if ($marker) {
                    $holeStart = $marker->hole_start ?? 1;
                    $holeEnd = $marker->hole_end ?? 18;
                }
            }

            $holesQuery = $group->tournament->holes()
                ->whereBetween('number', [$holeStart, $holeEnd]);
            if ($group->course_id) {
                $holesQuery->where('course_id', $group->course_id);
            } else {
                $holesQuery->whereNull('course_id');
            }
            $holeIds = $holesQuery->pluck('id');
            if ($holeIds->isEmpty()) {
                $holeIds = $group->tournament->holes()
                    ->whereBetween('number', [$holeStart, $holeEnd])
                    ->pluck('id');
            }

            $holesCount = $holeIds->count();
            $scoredCount = Score::whereIn('player_id', $group->players->pluck('id'))
                ->whereIn('hole_id', $holeIds)
                ->count();
            $totalExpected = $playerCount * $holesCount;
            $group->scoring_progress = $totalExpected > 0 ? min(100, round(($scoredCount / $totalExpected) * 100)) : 0;
        });

        return Inertia::render('Marqueur/Groups', [
            'groups' => $groups,
        ]);
    }

    public function scoring(Group $group)
    {
        $players = $group->players()->with('category')->get();

        $categoryIds = $players->pluck('category_id')->filter()->unique();
        $categoryHoleIds = DB::table('category_hole')
            ->whereIn('category_id', $categoryIds)
            ->pluck('hole_id')
            ->unique();

        if ($categoryHoleIds->isNotEmpty()) {
            $holes = $group->tournament->holes()
                ->whereIn('id', $categoryHoleIds)
                ->orderBy('number')
                ->get();
        } else {
            $courseIds = $players->pluck('category.course_id')->filter()->unique();
            if ($courseIds->isNotEmpty()) {
                $holes = $group->tournament->holes()
                    ->whereIn('course_id', $courseIds)
                    ->orderBy('number')
                    ->get();
            } else {
                $holes = $group->tournament->holes()
                    ->whereNull('course_id')
                    ->orderBy('number')
                    ->get();
            }
            if ($holes->isEmpty()) {
                $holes = $group->tournament->holes()
                    ->orderBy('number')
                    ->get();
            }
        }

        // Filter holes by the marker's hole range (from the user who is the marker)
        $holeStart = 1;
        $holeEnd = 18;
        if ($group->marker_id) {
            $marker = \App\Models\User::find($group->marker_id);
            if ($marker) {
                $holeStart = $marker->hole_start ?? 1;
                $holeEnd = $marker->hole_end ?? 18;
            }
        }
        $holes = $holes->filter(fn ($h) => $h->number >= $holeStart && $h->number <= $holeEnd)->values();

        $scores = Score::whereIn('player_id', $players->pluck('id'))
            ->whereIn('hole_id', $holes->pluck('id'))
            ->get()
            ->groupBy('player_id');

        $categoryPars = DB::table('category_hole')
            ->whereIn('hole_id', $holes->pluck('id'))
            ->get(['category_id', 'hole_id', 'par']);

        // Check if marker has multiple groups (show back to groups button)
        $markerGroupIds = request()->session()->get('marker_group_ids', []);
        $hasMultipleGroups = count($markerGroupIds) > 1;

        return Inertia::render('Marqueur/Scoring', [
            'group' => $group,
            'groupCode' => $group->code,
            'players' => $players,
            'holes' => $holes,
            'existingScores' => $scores,
            'tournamentId' => $group->tournament_id,
            'categoryPars' => $categoryPars,
            'hasMultipleGroups' => $hasMultipleGroups,
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

        $phase = $group->phase;
        $tournamentHoleIds = $group->tournament->holes()->pluck('id')->toArray();
        $tournamentPlayerIds = $group->tournament->players()->pluck('id')->toArray();

        foreach ($validated['scores'] as $scoreData) {
            if (!in_array($scoreData['player_id'], $tournamentPlayerIds)) {
                continue;
            }
            if (!in_array($scoreData['hole_id'], $tournamentHoleIds)) {
                continue;
            }

            Score::updateOrCreate(
                [
                    'player_id' => $scoreData['player_id'],
                    'hole_id' => $scoreData['hole_id'],
                    'phase' => $phase,
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

        $request->session()->put('marker_group_ids', [$group->id]);
        $request->session()->put('marker_group_id', $group->id);
        $request->session()->put('marker_group_code', $group->code);
        $request->session()->put('marker_tournament_id', $group->tournament_id);

        return redirect()->route('marqueur.scoring', $group);
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['marker_group_id', 'marker_group_code', 'marker_group_ids', 'marker_tournament_id']);

        return redirect()->route('marqueur.login');
    }
}
