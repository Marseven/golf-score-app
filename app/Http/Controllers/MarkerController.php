<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Group;
use App\Models\Player;
use App\Models\Score;
use App\Models\Setting;
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
            // Try to find marker by PIN in pivot table
            $pivotEntry = \DB::table('group_marker')
                ->where('marker_pin', $validated['pin'])
                ->first();

            if (!$pivotEntry) {
                // Fallback: try legacy marker_pin on groups table
                $pivotEntry = Group::where('marker_pin', $validated['pin'])
                    ->whereHas('tournament', fn ($q) => $q->whereIn('status', ['published', 'active']))
                    ->first();
                if ($pivotEntry) {
                    $request->session()->put('marker_group_ids', [$pivotEntry->id]);
                    $request->session()->put('marker_group_id', $pivotEntry->id);
                    $request->session()->put('marker_group_code', $pivotEntry->code);
                    $request->session()->put('marker_tournament_id', $pivotEntry->tournament_id);
                    $request->session()->put('marker_user_id', $pivotEntry->marker_id);
                    return redirect()->route('marqueur.scoring', $pivotEntry);
                }
                return back()->withErrors(['pin' => 'PIN invalide.']);
            }

            $markerId = $pivotEntry->user_id;

            // Find all groups for this marker via pivot
            $markerGroups = \DB::table('group_marker')
                ->where('user_id', $markerId)
                ->join('groups', 'groups.id', '=', 'group_marker.group_id')
                ->whereIn('groups.tournament_id', function ($q) {
                    $q->select('id')->from('tournaments')->whereIn('status', ['published', 'active']);
                })
                ->pluck('groups.id')
                ->toArray();

            $firstGroup = Group::find($markerGroups[0] ?? null);
            if (!$firstGroup) {
                return back()->withErrors(['pin' => 'PIN invalide.']);
            }

            $request->session()->put('marker_group_ids', $markerGroups);
            $request->session()->put('marker_tournament_id', $firstGroup->tournament_id);
            $request->session()->put('marker_user_id', $markerId);

            if (count($markerGroups) === 1) {
                $request->session()->put('marker_group_id', $firstGroup->id);
                $request->session()->put('marker_group_code', $firstGroup->code);
                return redirect()->route('marqueur.scoring', $firstGroup);
            }

            return redirect()->route('marqueur.groups');
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
            $request->session()->put('marker_user_id', $group->marker_id);

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

        // Calculate scoring progress based on current marker's hole range
        $markerUserId = $request->session()->get('marker_user_id');
        $currentMarker = $markerUserId ? \App\Models\User::find($markerUserId) : null;
        $markerHoleStart = $currentMarker?->hole_start ?? 1;
        $markerHoleEnd = $currentMarker?->hole_end ?? 18;

        $groups->each(function ($group) use ($markerHoleStart, $markerHoleEnd) {
            $playerCount = $group->players->count();
            $holeStart = $markerHoleStart;
            $holeEnd = $markerHoleEnd;

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

        // Filter holes by the current marker's hole range
        $holeStart = 1;
        $holeEnd = 18;
        $markerUserId = request()->session()->get('marker_user_id');
        if ($markerUserId) {
            $marker = \App\Models\User::find($markerUserId);
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
        $scoreConfirmationEnabled = Setting::getValue('score_confirmation_enabled', '0') === '1';

        return Inertia::render('Marqueur/Scoring', [
            'group' => $group,
            'groupCode' => $group->code,
            'players' => $players,
            'holes' => $holes,
            'existingScores' => $scores,
            'tournamentId' => $group->tournament_id,
            'categoryPars' => $categoryPars,
            'hasMultipleGroups' => $hasMultipleGroups,
            'scoreConfirmationEnabled' => $scoreConfirmationEnabled,
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
        $saved = 0;
        $skipped = 0;

        foreach ($validated['scores'] as $scoreData) {
            if (!in_array($scoreData['player_id'], $tournamentPlayerIds)) {
                $skipped++;
                continue;
            }
            if (!in_array($scoreData['hole_id'], $tournamentHoleIds)) {
                $skipped++;
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
            $saved++;
        }

        \Log::info('Marker saveScores', [
            'group' => $group->code,
            'received' => count($validated['scores']),
            'saved' => $saved,
            'skipped' => $skipped,
        ]);

        broadcast(new ScoreUpdated($group->tournament_id))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'saved' => $saved, 'skipped' => $skipped]);
        }

        return back()->with('success', "Scores enregistrés ({$saved} sauvés).");
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
