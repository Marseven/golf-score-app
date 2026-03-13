<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\UserRole;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'marker_id' => 'nullable|uuid|exists:users,id',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $count = $tournament->groups()->count() + 1;
        $code = 'GOLF-'.date('Y').'-G'.$count;

        $groupData = [
            'code' => $code,
            'tee_time' => $validated['tee_time'],
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
            'marker_id' => 'nullable|uuid|exists:users,id',
            'player_ids' => 'nullable|array',
            'player_ids.*' => 'uuid|exists:players,id',
        ]);

        $groupData = ['tee_time' => $validated['tee_time']];

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

    public function destroy(Tournament $tournament, Group $group)
    {
        $group->players()->update(['group_id' => null]);
        $group->delete();

        return back()->with('success', 'Groupe supprimé.');
    }
}
