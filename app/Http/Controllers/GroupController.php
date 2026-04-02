<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class GroupController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'tee_date' => 'nullable|date',
            'phase' => 'integer|min:1|max:4',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'course_id' => 'nullable|uuid|exists:courses,id',
            'hole_start' => 'integer|min:1|max:18',
            'hole_end' => 'integer|min:1|max:18',
            'marker_id' => 'nullable|uuid|exists:users,id',
            'marker_phone' => 'nullable|string|max:50',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $phase = $validated['phase'] ?? 1;
        $categoryId = $validated['category_id'] ?? null;

        if (! empty($validated['player_ids'])) {
            $playersQuery = Player::where('tournament_id', $tournament->id)
                ->whereIn('id', $validated['player_ids']);

            if ($categoryId) {
                $wrongCategory = (clone $playersQuery)->where('category_id', '!=', $categoryId)->count();
                if ($wrongCategory > 0) {
                    return back()->withErrors(['player_ids' => 'Certains joueurs ne sont pas dans la catégorie sélectionnée.']);
                }
            }

            if ($phase > 1) {
                $cutPlayers = (clone $playersQuery)->where(function ($q) use ($phase) {
                    $q->whereNotNull('cut_after_phase')
                      ->where('cut_after_phase', '<', $phase);
                })->count();
                if ($cutPlayers > 0) {
                    return back()->withErrors(['player_ids' => 'Certains joueurs ont été éliminés avant cette phase.']);
                }
            }
        }

        $code = $this->generateUniqueGroupCode();

        $groupData = [
            'code' => $code,
            'tee_time' => $validated['tee_time'],
            'tee_date' => $validated['tee_date'] ?? null,
            'phase' => $phase,
            'category_id' => $categoryId,
            'course_id' => $validated['course_id'] ?? null,
            'hole_start' => $validated['hole_start'] ?? 1,
            'hole_end' => $validated['hole_end'] ?? 18,
            'marker_phone' => $validated['marker_phone'] ?? null,
        ];

        if (! empty($validated['marker_id'])) {
            $groupData['marker_id'] = $validated['marker_id'];

            UserRole::firstOrCreate([
                'user_id' => $validated['marker_id'],
                'tournament_id' => $tournament->id,
                'role' => 'marker',
            ]);
        }

        $group = $tournament->groups()->create($groupData);

        if (! empty($validated['player_ids'])) {
            Player::where('tournament_id', $tournament->id)
                ->whereIn('id', $validated['player_ids'])
                ->update(['group_id' => $group->id]);
        }

        return back()->with('success', 'Groupe créé.');
    }

    public function update(Request $request, Tournament $tournament, Group $group)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'tee_date' => 'nullable|date',
            'phase' => 'integer|min:1|max:4',
            'category_id' => 'nullable|uuid|exists:categories,id',
            'course_id' => 'nullable|uuid|exists:courses,id',
            'hole_start' => 'integer|min:1|max:18',
            'hole_end' => 'integer|min:1|max:18',
            'marker_id' => 'nullable|uuid|exists:users,id',
            'marker_phone' => 'nullable|string|max:50',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $phase = $validated['phase'] ?? $group->phase;
        $categoryId = $validated['category_id'] ?? null;

        $groupData = [
            'tee_time' => $validated['tee_time'],
            'tee_date' => $validated['tee_date'] ?? null,
            'phase' => $phase,
            'category_id' => $categoryId,
            'course_id' => $validated['course_id'] ?? null,
            'hole_start' => $validated['hole_start'] ?? $group->hole_start,
            'hole_end' => $validated['hole_end'] ?? $group->hole_end,
            'marker_phone' => $validated['marker_phone'] ?? null,
        ];

        if (! empty($validated['marker_id'])) {
            $groupData['marker_id'] = $validated['marker_id'];

            UserRole::firstOrCreate([
                'user_id' => $validated['marker_id'],
                'tournament_id' => $tournament->id,
                'role' => 'marker',
            ]);
        } elseif ($request->has('marker_id')) {
            $groupData['marker_id'] = null;
        }

        $group->update($groupData);

        // Unassign all current players from this group
        $group->players()->update(['group_id' => null]);

        // Assign selected players
        if (! empty($validated['player_ids'])) {
            Player::where('tournament_id', $tournament->id)
                ->whereIn('id', $validated['player_ids'])
                ->update(['group_id' => $group->id]);
        }

        return back()->with('success', 'Groupe mis à jour.');
    }

    public function availablePlayers(Tournament $tournament, Request $request)
    {
        $phase = (int) $request->input('phase', 1);
        $categoryId = $request->input('category_id');

        $query = $tournament->players()
            ->whereNull('group_id')
            ->where(function ($q) use ($phase) {
                $q->whereNull('cut_after_phase')
                  ->orWhere('cut_after_phase', '>=', $phase);
            });

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        return response()->json($query->with('category')->get());
    }

    public function storeMarker(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::min(6)],
            'hole_start' => 'integer|min:1|max:18',
            'hole_end' => 'integer|min:1|max:18',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'hole_start' => $validated['hole_start'] ?? 1,
            'hole_end' => $validated['hole_end'] ?? 18,
        ]);

        UserRole::create([
            'user_id' => $user->id,
            'tournament_id' => null,
            'role' => 'marker',
        ]);

        return back()->with('success', 'Marqueur "'.$user->name.'" cree avec succes.');
    }

    public function destroy(Tournament $tournament, Group $group)
    {
        $group->players()->update(['group_id' => null]);
        $group->delete();

        return back()->with('success', 'Groupe supprimé.');
    }

    private function generateUniqueGroupCode(): string
    {
        $maxAttempts = 10;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $code = 'G-'.date('Y').'-'.strtoupper(Str::random(5));
            if (! Group::where('code', $code)->exists()) {
                return $code;
            }
        }

        return 'G-'.date('Y').'-'.strtoupper(Str::random(8));
    }
}
