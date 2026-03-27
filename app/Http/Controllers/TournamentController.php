<?php

namespace App\Http\Controllers;

use App\Models\Cut;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Http\Request;
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
        $tournament->load([
            'courses',
            'categories',
            'groups.players.category',
            'groups.marker',
            'groups.category',
            'players.category',
            'players.group',
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
        )->orderBy('name')->get(['id', 'name', 'email']);

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
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
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
            ['name' => 'Pro H', 'short_name' => 'PH', 'color' => 'blue', 'course_id' => $defaultCourse->id],
            ['name' => 'Pro F', 'short_name' => 'PF', 'color' => 'pink', 'course_id' => $defaultCourse->id],
            ['name' => 'Amateur H', 'short_name' => 'AH', 'color' => 'emerald', 'course_id' => $defaultCourse->id],
            ['name' => 'Amateur F', 'short_name' => 'AF', 'color' => 'violet', 'course_id' => $defaultCourse->id],
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

        // Create Cut records for multi-phase tournaments
        $phaseCount = $validated['phase_count'] ?? 1;
        if ($phaseCount > 1) {
            foreach ($categoryIds as $categoryId) {
                for ($phase = 1; $phase < $phaseCount; $phase++) {
                    $tournament->cuts()->create([
                        'category_id' => $categoryId,
                        'after_phase' => $phase,
                    ]);
                }
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
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'club' => 'required|string|max:255',
            'status' => 'required|in:draft,published,active,finished',
            'scoring_mode' => 'required|in:stroke_play,stableford,both',
            'phase_count' => 'integer|min:1|max:4',
            'score_aggregation' => 'in:cumulative,separate',
            'rules' => 'nullable|string',
            'registration_open' => 'boolean',
            'registration_fee' => 'numeric|min:0',
            'registration_currency' => 'string|max:3',
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
            'after_phase' => 'required|integer|min:1|max:'.($tournament->phase_count - 1),
            'cuts' => 'required|array',
            'cuts.*.category_id' => 'required|uuid|exists:categories,id',
            'cuts.*.qualified_count' => 'required|integer|min:1',
        ]);

        $afterPhase = $validated['after_phase'];

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

            $ranked = $players->sortBy(function ($player) {
                $totalStrokes = $player->scores->sum('strokes');
                $totalPar = $player->scores->sum(fn ($s) => $s->hole->par ?? 0);

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

    public function destroy(Tournament $tournament)
    {
        $tournament->delete();

        return redirect()->route('admin.dashboard')->with('success', 'Tournoi supprimé.');
    }
}
