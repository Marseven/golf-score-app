<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class GroupController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'tee_date' => 'nullable|date',
            'marker_id' => 'nullable|uuid|exists:users,id',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $count = $tournament->groups()->count() + 1;
        $code = 'GOLF-'.date('Y').'-G'.$count;

        $groupData = [
            'code' => $code,
            'tee_time' => $validated['tee_time'],
            'tee_date' => $validated['tee_date'] ?? null,
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
            'marker_id' => 'nullable|uuid|exists:users,id',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $groupData = [
            'tee_time' => $validated['tee_time'],
            'tee_date' => $validated['tee_date'] ?? null,
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

    public function storeMarker(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::min(6)],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
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
}
