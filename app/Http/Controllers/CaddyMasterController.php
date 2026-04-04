<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Group;
use App\Models\Player;
use App\Models\Score;
use App\Models\Setting;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $tournament = Tournament::where('caddie_master_pin', $validated['pin'])->first();

        if (! $tournament) {
            return back()->withErrors(['pin' => 'PIN invalide.']);
        }

        if (! in_array($tournament->status, ['published', 'active'])) {
            return back()->withErrors(['pin' => 'Le tournoi associé n\'est pas encore publié ou est terminé.']);
        }

        $request->session()->put('caddie_master_tournament_id', $tournament->id);

        return redirect()->route('caddie-master.dashboard');
    }

    public function dashboard(Request $request)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        $tournament = Tournament::findOrFail($tournamentId);

        $allGroups = $tournament->groups()
            ->with(['players.category', 'players.scores', 'category'])
            ->orderBy('phase')
            ->orderBy('tee_time')
            ->get();

        // Only show groups at the latest phase per category (hide completed phases)
        $groups = $allGroups->filter(function ($group) use ($allGroups) {
            $laterPhaseExists = $allGroups
                ->where('category_id', $group->category_id)
                ->where('phase', '>', $group->phase)
                ->contains(fn ($g) => $g->players->count() > 0);
            return !$laterPhaseExists;
        })->values();

        $holes = $tournament->holes()->orderBy('number')->get();

        $groups->each(function ($group) use ($holes) {
            $playerCount = $group->players->count();
            $phase = $group->phase ?? 1;

            // Get holes for this group's course
            $groupHoles = $group->course_id
                ? $holes->where('course_id', $group->course_id)
                : $holes->filter(fn ($h) => !$h->course_id);
            if ($groupHoles->isEmpty()) $groupHoles = $holes;

            // Filter by hole range (hole_start/hole_end from group)
            $holeStart = $group->hole_start ?? 1;
            $holeEnd = $group->hole_end ?? 18;
            $groupHoles = $groupHoles->filter(fn ($h) => $h->number >= $holeStart && $h->number <= $holeEnd);
            $holeIds = $groupHoles->pluck('id');
            $holesCount = $holeIds->count();

            // Count scores only for this phase and these holes
            $scoredCount = \App\Models\Score::whereIn('player_id', $group->players->pluck('id'))
                ->whereIn('hole_id', $holeIds)
                ->where('phase', $phase)
                ->count();

            $totalExpected = $playerCount * $holesCount;
            $group->scoring_progress = $totalExpected > 0
                ? min(100, round(($scoredCount / $totalExpected) * 100))
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

        // Get holes for this group's players
        // 1) Try category_hole pivot (if categories have specific holes assigned)
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
            // 2) Fallback: use holes from the category's course, or default course (no course_id)
            $courseIds = $players->pluck('category.course_id')->filter()->unique();
            if ($courseIds->isNotEmpty()) {
                $holes = $group->tournament->holes()
                    ->whereIn('course_id', $courseIds)
                    ->orderBy('number')
                    ->get();
            } else {
                // 3) Fallback: default course holes (course_id is null)
                $holes = $group->tournament->holes()
                    ->whereNull('course_id')
                    ->orderBy('number')
                    ->get();
            }

            // 4) Last resort: all tournament holes
            if ($holes->isEmpty()) {
                $holes = $group->tournament->holes()
                    ->orderBy('number')
                    ->get();
            }
        }

        // Filter holes by the group's hole range
        $holeStart = $group->hole_start ?? 1;
        $holeEnd = $group->hole_end ?? 18;
        $holes = $holes->filter(fn ($h) => $h->number >= $holeStart && $h->number <= $holeEnd)->values();

        $scores = Score::whereIn('player_id', $players->pluck('id'))
            ->whereIn('hole_id', $holes->pluck('id'))
            ->where('phase', $group->phase) // Only scores for this phase
            ->get()
            ->groupBy('player_id');

        $categoryPars = DB::table('category_hole')
            ->whereIn('hole_id', $holes->pluck('id'))
            ->get(['category_id', 'hole_id', 'par']);

        $scoreConfirmationEnabled = Setting::getValue('score_confirmation_enabled', '0') === '1';

        return Inertia::render('CaddyMaster/Scoring', [
            'group' => $group,
            'groupCode' => $group->code,
            'players' => $players,
            'holes' => $holes,
            'existingScores' => $scores,
            'tournamentId' => $group->tournament_id,
            'categoryPars' => $categoryPars,
            'scoreConfirmationEnabled' => $scoreConfirmationEnabled,
        ]);
    }

    public function saveScores(Request $request, Group $group)
    {
        $tournamentId = $request->session()->get('caddie_master_tournament_id');
        if ($group->tournament_id !== $tournamentId) {
            \Log::warning('CaddyMaster saveScores: tournament mismatch', [
                'session_tournament' => $tournamentId,
                'group_tournament' => $group->tournament_id,
            ]);
            abort(403);
        }

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

        \Log::info('CaddyMaster saveScores', [
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
