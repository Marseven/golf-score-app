<?php

namespace App\Http\Controllers;

use App\Events\ScoreUpdated;
use App\Models\Cut;
use App\Models\Penalty;
use App\Models\Player;
use App\Models\Score;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        // Ensure Cut records exist for all categories and their phases
        foreach ($tournament->categories as $category) {
            $catMaxPhases = $category->max_phases ?? $tournament->phase_count;
            $maxCutPhase = max(1, $catMaxPhases - 1);
            for ($phase = 1; $phase <= $maxCutPhase; $phase++) {
                Cut::firstOrCreate([
                    'tournament_id' => $tournament->id,
                    'category_id' => $category->id,
                    'after_phase' => $phase,
                ]);
            }
        }

        $tournament->load([
            'courses',
            'categories',
            'groups.players.category',
            'groups.marker',
            'groups.markers',
            'groups.category',
            'groups.course',
            'players.category',
            'players.group.course',
            'players.payments',
            'holes',
            'cuts.category',
        ]);

        $scores = $tournament->scores()->with('hole')->get();
        $payments = $tournament->payments()->with('player')->get();

        $registrations = $tournament->players()
            ->whereNotNull('email')
            ->with('category', 'payments')
            ->latest()
            ->get();

        $markers = User::whereHas('roles', fn ($q) => $q->where('role', 'marker')
            ->where(fn ($q2) => $q2->whereNull('tournament_id')->orWhere('tournament_id', $tournament->id))
        )->orderBy('name')->get(['id', 'name', 'email', 'hole_start', 'hole_end']);

        $categoryPars = DB::table('category_hole')
            ->whereIn('hole_id', $tournament->holes()->pluck('holes.id'))
            ->get(['category_id', 'hole_id', 'par']);

        $penalties = $tournament->penalties()->with('player', 'creator')->latest()->get();

        return Inertia::render('Admin/Tournaments/Manage', [
            'tournament' => $tournament,
            'courses' => $tournament->courses,
            'categories' => $tournament->categories,
            'players' => $tournament->players,
            'groups' => $tournament->groups,
            'holes' => $tournament->holes,
            'scores' => $scores,
            'cuts' => $tournament->cuts,
            'registrations' => $registrations,
            'payments' => $payments,
            'markers' => $markers,
            'categoryPars' => $categoryPars,
            'penalties' => $penalties,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'club' => 'required|string|max:255',
            'scoring_mode' => 'required|in:stroke_play,stableford,both',
            'phase_count' => 'integer|min:1|max:4',
            'score_aggregation' => 'in:cumulative,separate',
            'rules' => 'nullable|string',
        ]);

        $tournament = Tournament::create([
            ...$validated,
            'phase_count' => $validated['phase_count'] ?? 1,
            'score_aggregation' => $validated['score_aggregation'] ?? 'cumulative',
            'caddie_master_pin' => Tournament::generateUniqueCaddieMasterPin(),
            'created_by' => $request->user()->id,
        ]);

        $tournament->syncStatus();

        // Create default course
        $defaultCourse = $tournament->courses()->create([
            'name' => 'Parcours principal',
        ]);

        // Create default categories (linked to default course)
        $defaultCategories = [
            ['name' => 'Pro F', 'short_name' => 'PF', 'color' => 'pink', 'course_id' => $defaultCourse->id],
            ['name' => 'Pro H', 'short_name' => 'PH', 'color' => 'blue', 'course_id' => $defaultCourse->id],
            ['name' => 'Amateur F', 'short_name' => 'AF', 'color' => 'violet', 'course_id' => $defaultCourse->id],
            ['name' => 'Amateur H', 'short_name' => 'AH', 'color' => 'emerald', 'course_id' => $defaultCourse->id],
        ];

        $categoryIds = [];
        foreach ($defaultCategories as $cat) {
            $category = $tournament->categories()->create($cat);
            $categoryIds[] = $category->id;
        }

        // Create default 18 holes (on default course)
        for ($i = 1; $i <= 18; $i++) {
            $tournament->holes()->create([
                'course_id' => $defaultCourse->id,
                'number' => $i,
                'par' => 4,
                'distance' => 0,
                'hole_index' => $i,
            ]);
        }

        // Create Cut records for all tournaments (phase 1 for single-phase, all phases for multi-phase)
        $phaseCount = $validated['phase_count'] ?? 1;
        $maxPhase = max(1, $phaseCount - 1);
        foreach ($categoryIds as $categoryId) {
            for ($phase = 1; $phase <= $maxPhase; $phase++) {
                $tournament->cuts()->create([
                    'category_id' => $categoryId,
                    'after_phase' => $phase,
                ]);
            }
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
            'name' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'club' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|in:draft,published,active,finished',
            'scoring_mode' => 'sometimes|required|in:stroke_play,stableford,both',
            'phase_count' => 'sometimes|integer|min:1|max:4',
            'score_aggregation' => 'sometimes|in:cumulative,separate',
            'rules' => 'nullable|string',
            'registration_open' => 'sometimes|boolean',
            'registration_fee' => 'nullable|numeric|min:0',
            'registration_currency' => 'nullable|string|max:3',
            'caddie_master_pin' => 'nullable|string|digits:6|unique:tournaments,caddie_master_pin,'.$tournament->id,
        ]);

        $oldPhaseCount = $tournament->phase_count;
        $tournament->update($validated);
        $tournament->syncStatus();

        // If phase_count changed, ensure Cut records exist for all categories and phases
        $newPhaseCount = $tournament->phase_count;
        if ($newPhaseCount !== $oldPhaseCount && $newPhaseCount > 1) {
            $categoryIds = $tournament->categories()->pluck('id');
            foreach ($categoryIds as $categoryId) {
                for ($phase = 1; $phase < $newPhaseCount; $phase++) {
                    Cut::firstOrCreate([
                        'tournament_id' => $tournament->id,
                        'category_id' => $categoryId,
                        'after_phase' => $phase,
                    ]);
                }
            }
        }

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

    public function applyPhaseCut(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'after_phase' => 'required|integer|min:1|max:'.max(1, $tournament->phase_count - 1),
            'cuts' => 'required|array',
            'cuts.*.category_id' => 'required|uuid|exists:categories,id',
            'cuts.*.qualified_count' => 'required|integer|min:1',
        ]);

        $afterPhase = $validated['after_phase'];

        $catPars = DB::table('category_hole')
            ->whereIn('hole_id', $tournament->holes()->pluck('holes.id'))
            ->get()
            ->keyBy(fn ($r) => $r->category_id.':'.$r->hole_id);

        foreach ($validated['cuts'] as $cutData) {
            $categoryId = $cutData['category_id'];
            $qualifiedCount = $cutData['qualified_count'];

            // Get players in this category, ranked by stroke-to-par for this phase
            $players = $tournament->players()
                ->where('category_id', $categoryId)
                ->with(['scores' => function ($q) use ($afterPhase, $tournament) {
                    if ($tournament->score_aggregation === 'cumulative') {
                        $q->where('phase', '<=', $afterPhase);
                    } else {
                        $q->where('phase', $afterPhase);
                    }
                }, 'scores.hole'])
                ->where(function ($q) use ($afterPhase) {
                    $q->whereNull('cut_after_phase')
                      ->orWhere('cut_after_phase', '>=', $afterPhase);
                })
                ->get();

            $ranked = $players->sortBy(function ($player) use ($catPars, $categoryId) {
                $totalStrokes = $player->scores->sum('strokes');
                $totalPar = $player->scores->sum(function ($s) use ($catPars, $categoryId) {
                    $key = $categoryId.':'.$s->hole_id;

                    return isset($catPars[$key]) ? $catPars[$key]->par : ($s->hole->par ?? 0);
                });

                return $totalStrokes - $totalPar;
            })->values();

            foreach ($ranked as $index => $player) {
                if ($index >= $qualifiedCount) {
                    $player->update(['cut_after_phase' => $afterPhase]);
                }
            }

            // Update Cut record
            Cut::updateOrCreate(
                [
                    'tournament_id' => $tournament->id,
                    'category_id' => $categoryId,
                    'after_phase' => $afterPhase,
                ],
                [
                    'qualified_count' => $qualifiedCount,
                    'applied_at' => now(),
                ]
            );
        }

        return back()->with('success', 'Cut appliqué pour la phase '.$afterPhase.'.');
    }

    public function resetPhaseCut(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'after_phase' => 'required|integer|min:1',
        ]);

        $afterPhase = $validated['after_phase'];

        // Reset players cut after this phase
        $tournament->players()
            ->where('cut_after_phase', $afterPhase)
            ->update(['cut_after_phase' => null]);

        // Reset Cut records for this phase
        $tournament->cuts()
            ->where('after_phase', $afterPhase)
            ->update(['applied_at' => null]);

        return back()->with('success', 'Cut réinitialisé pour la phase '.$afterPhase.'.');
    }

    public function updateScores(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.player_id' => 'required|uuid|exists:players,id',
            'scores.*.hole_id' => 'required|uuid|exists:holes,id',
            'scores.*.strokes' => 'required|integer|min:1',
            'scores.*.phase' => 'integer|min:1',
        ]);

        $tournamentHoleIds = $tournament->holes()->pluck('id')->toArray();
        $tournamentPlayerIds = $tournament->players()->pluck('id')->toArray();

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
                    'phase' => $scoreData['phase'] ?? 1,
                ],
                [
                    'strokes' => $scoreData['strokes'],
                    'synced' => true,
                ]
            );
        }

        broadcast(new ScoreUpdated($tournament->id))->toOthers();

        return back()->with('success', 'Scores mis à jour.');
    }

    public function resetScores(Request $request, Tournament $tournament)
    {
        $phase = $request->input('phase');
        $categoryId = $request->input('category_id');

        if ($categoryId) {
            $category = $tournament->categories()->find($categoryId);
            $catName = $category ? $category->name : '?';
            $playerIds = $tournament->players()->where('category_id', $categoryId)->pluck('id');

            $query = Score::whereIn('player_id', $playerIds);
            if ($phase) {
                $query->where('phase', $phase);
            }
            $count = $query->count();
            $query->delete();

            // Delete penalties for this category
            $penQuery = $tournament->penalties()->whereIn('player_id', $playerIds);
            if ($phase) {
                $penQuery->where('phase', $phase);
            }
            $penQuery->delete();

            broadcast(new ScoreUpdated($tournament->id))->toOthers();

            $msg = $phase ? "{$count} scores de {$catName} Phase {$phase} supprimés." : "{$count} scores de {$catName} supprimés.";
            return back()->with('success', $msg);
        }

        if ($phase) {
            $count = $tournament->scores()->where('phase', $phase)->count();
            $tournament->scores()->where('phase', $phase)->delete();
            $tournament->penalties()->where('phase', $phase)->delete();

            $tournament->groups()->where('phase', $phase)->update([
                'scores_confirmed_at' => null,
                'confirmed_by_name' => null,
            ]);

            broadcast(new ScoreUpdated($tournament->id))->toOthers();

            return back()->with('success', "{$count} scores de la Phase {$phase} supprimés.");
        }

        // Delete all scores
        $count = $tournament->scores()->count();
        $tournament->scores()->delete();
        $tournament->penalties()->delete();

        $tournament->groups()->update([
            'scores_confirmed_at' => null,
            'confirmed_by_name' => null,
        ]);

        $tournament->players()->update(['cut_after_phase' => null]);
        $tournament->cuts()->update(['applied_at' => null]);

        broadcast(new ScoreUpdated($tournament->id))->toOthers();

        return back()->with('success', "{$count} scores supprimés. Tournoi réinitialisé.");
    }

    public function storePenalty(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'player_id' => 'required|uuid|exists:players,id',
            'strokes' => 'required|integer|min:1|max:10',
            'reason' => 'required|string|max:255',
            'phase' => 'integer|min:1',
        ]);

        $tournament->penalties()->create([
            ...$validated,
            'phase' => $validated['phase'] ?? 1,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Pénalité ajoutée.');
    }

    public function destroyPenalty(Tournament $tournament, Penalty $penalty)
    {
        if ($penalty->tournament_id !== $tournament->id) {
            abort(403);
        }

        $penalty->delete();

        return back()->with('success', 'Pénalité supprimée.');
    }

    public function prepareNextPhase(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'from_phase' => 'required|integer|min:1',
            'category_id' => 'nullable|uuid|exists:categories,id',
        ]);

        $fromPhase = $validated['from_phase'];
        $nextPhase = $fromPhase + 1;
        $categoryId = $validated['category_id'] ?? null;

        // Check phase limit: use category max_phases if filtering by category, else tournament phase_count
        $maxPhases = $tournament->phase_count;
        $categoryName = null;
        if ($categoryId) {
            $category = $tournament->categories()->find($categoryId);
            if ($category) {
                $maxPhases = $category->max_phases ?? $tournament->phase_count;
                $categoryName = $category->name;
            }
        }

        if ($nextPhase > $maxPhases) {
            $label = $categoryName ? "la catégorie {$categoryName}" : 'le tournoi';
            return back()->with('error', "{$label} n'a que {$maxPhases} phase(s).");
        }

        // Build query scoped to category if specified
        // Include groups with matching category_id OR groups without category_id that have players in this category
        $scopeCategory = function ($query) use ($categoryId) {
            if ($categoryId) {
                $query->where(function ($q) use ($categoryId) {
                    $q->where('category_id', $categoryId)
                      ->orWhere(function ($q2) use ($categoryId) {
                          $q2->whereNull('category_id')
                             ->whereHas('players', fn ($pq) => $pq->where('category_id', $categoryId));
                      });
                });
            }
            return $query;
        };

        // Check if next phase groups already exist (for this category)
        $existingNextGroups = $scopeCategory($tournament->groups()->where('phase', $nextPhase))->count();
        if ($existingNextGroups > 0) {
            if (!$request->boolean('force')) {
                return back()->with('error', 'PHASE_EXISTS:'.$nextPhase.':'.$existingNextGroups);
            }

            // Force: delete next phase groups (for this category)
            $nextPhaseGroups = $scopeCategory($tournament->groups()->where('phase', $nextPhase))->with('players')->get();

            // Build source group mapping by stripping phase prefix from code
            $sourceGroups = $scopeCategory($tournament->groups()->where('phase', $fromPhase))->get();
            $sourceGroupByCode = [];
            foreach ($sourceGroups as $sg) {
                $sourceGroupByCode[$sg->code] = $sg->id;
            }

            foreach ($nextPhaseGroups as $g) {
                $playerIds = $g->players->pluck('id')->toArray();

                // Delete scores for this phase
                Score::whereIn('player_id', $playerIds)
                    ->where('phase', $nextPhase)
                    ->delete();

                // Reassign legacy group_id back to source group
                $sourceCode = preg_replace('/^P\d+-/', '', $g->code);
                $sourceGroupId = $sourceGroupByCode[$sourceCode] ?? null;
                if ($sourceGroupId) {
                    Player::whereIn('id', $playerIds)->update(['group_id' => $sourceGroupId]);
                }

                // Detach players from pivot, markers, and delete group
                $g->players()->detach();
                $g->markers()->detach();
                $g->delete();
            }
        }

        // Get groups from the source phase (for this category), including empty ones
        $currentGroups = $scopeCategory($tournament->groups()
            ->where('phase', $fromPhase))
            ->with(['players', 'markers'])
            ->get();

        $createdGroups = 0;
        $totalPlayers = 0;
        $eliminatedPlayers = 0;

        foreach ($currentGroups as $group) {
            // Filter out cut and withdrawn players
            $qualifiedPlayers = $group->players->filter(function ($player) use ($fromPhase) {
                if ($player->is_withdrawn) return false;
                if ($player->cut_after_phase !== null && $player->cut_after_phase <= $fromPhase) return false;
                return true;
            });

            $eliminatedPlayers += $group->players->count() - $qualifiedPlayers->count();

            // Create new group for next phase (even if empty, so admin can reassign players)
            $newCode = 'P'.$nextPhase.'-'.$group->code;

            // Check if group with this code already exists (e.g. mixed group already created by another category)
            $newGroup = $tournament->groups()->where('code', $newCode)->first();
            if (!$newGroup) {
                $newGroup = $tournament->groups()->create([
                    'code' => $newCode,
                    'tee_time' => $group->tee_time,
                    'tee_date' => $group->tee_date,
                    'phase' => $nextPhase,
                    'category_id' => $group->category_id ?? $categoryId,
                    'course_id' => $group->course_id,
                    'marker_phone' => $group->marker_phone,
                ]);

                // Copy markers via pivot
                foreach ($group->markers as $marker) {
                    $newGroup->markers()->attach($marker->id, [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'marker_pin' => $marker->pivot->marker_pin,
                    ]);
                }
                $createdGroups++;
            }

            // Assign qualified players to new group via pivot (skip already attached)
            $existingPlayerIds = $newGroup->players()->pluck('players.id')->toArray();
            $pivotData = [];
            foreach ($qualifiedPlayers as $player) {
                if (in_array($player->id, $existingPlayerIds)) continue;
                $pivotData[$player->id] = ['id' => (string) \Illuminate\Support\Str::uuid()];
                $player->update(['group_id' => $newGroup->id]);
            }
            if (!empty($pivotData)) {
                $newGroup->players()->attach($pivotData);
            }

            $totalPlayers += count($pivotData);
        }

        $label = $categoryName ? " ({$categoryName})" : '';
        $message = "Phase {$nextPhase}{$label} préparée : {$createdGroups} groupe(s), {$totalPlayers} joueur(s)";
        if ($eliminatedPlayers > 0) {
            $message .= ", {$eliminatedPlayers} éliminé(s) par le cut";
        }

        return back()->with('success', $message.'.');
    }

    public function emptyPhaseGroups(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'phase' => 'required|integer|min:1',
            'category_id' => 'required|uuid|exists:categories,id',
        ]);

        $phase = $validated['phase'];
        $categoryId = $validated['category_id'];
        $category = $tournament->categories()->find($categoryId);

        $groups = $tournament->groups()
            ->where('phase', $phase)
            ->where('category_id', $categoryId)
            ->with('players')
            ->get();

        $totalDetached = 0;
        $groupIds = $groups->pluck('id')->toArray();
        foreach ($groups as $group) {
            $totalDetached += $group->players->count();
            $group->players()->detach();
        }
        // Clear legacy group_id for players pointing to these groups
        Player::whereIn('group_id', $groupIds)->update(['group_id' => null]);

        $catName = $category?->name ?? '';

        return back()->with('success', "J{$phase} {$catName} : {$totalDetached} joueur(s) retirés de {$groups->count()} groupe(s).");
    }

    public function deletePhaseGroups(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'phase' => 'required|integer|min:1',
            'category_id' => 'required|uuid|exists:categories,id',
        ]);

        $phase = $validated['phase'];
        $categoryId = $validated['category_id'];
        $category = $tournament->categories()->find($categoryId);

        $groups = $tournament->groups()
            ->where('phase', $phase)
            ->where('category_id', $categoryId)
            ->with('players')
            ->get();

        $deletedGroups = 0;
        $deletedScores = 0;

        foreach ($groups as $group) {
            $playerIds = $group->players->pluck('id')->toArray();

            // Delete scores for this phase
            $deletedScores += Score::whereIn('player_id', $playerIds)
                ->where('phase', $phase)
                ->delete();

            $group->players()->detach();
            $group->markers()->detach();
            $group->delete();
            $deletedGroups++;
        }

        $catName = $category?->name ?? '';

        return back()->with('success', "J{$phase} {$catName} : {$deletedGroups} groupe(s) et {$deletedScores} score(s) supprimés.");
    }

    public function destroy(Tournament $tournament)
    {
        $tournament->delete();

        return redirect()->route('admin.dashboard')->with('success', 'Tournoi supprimé.');
    }
}
