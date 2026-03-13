<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\Group;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'marker_name' => 'nullable|string|max:255',
            'marker_email' => 'nullable|email|max:255',
        ]);

        $count = $tournament->groups()->count() + 1;
        $code = 'GOLF-' . date('Y') . '-G' . $count;

        $groupData = [
            'code' => $code,
            'tee_time' => $validated['tee_time'],
        ];

        if (!empty($validated['marker_email'])) {
            $marker = User::firstOrCreate(
                ['email' => $validated['marker_email']],
                [
                    'name' => $validated['marker_name'] ?? explode('@', $validated['marker_email'])[0],
                    'password' => bcrypt(Str::random(32)),
                ]
            );

            UserRole::firstOrCreate([
                'user_id' => $marker->id,
                'tournament_id' => $tournament->id,
                'role' => 'marker',
            ]);

            $groupData['marker_id'] = $marker->id;
        }

        $tournament->groups()->create($groupData);

        return back()->with('success', 'Groupe créé.');
    }

    public function update(Request $request, Tournament $tournament, Group $group)
    {
        $validated = $request->validate([
            'tee_time' => 'required|string',
            'marker_name' => 'nullable|string|max:255',
            'marker_email' => 'nullable|email|max:255',
        ]);

        $groupData = ['tee_time' => $validated['tee_time']];

        if (!empty($validated['marker_email'])) {
            $marker = User::firstOrCreate(
                ['email' => $validated['marker_email']],
                [
                    'name' => $validated['marker_name'] ?? explode('@', $validated['marker_email'])[0],
                    'password' => bcrypt(Str::random(32)),
                ]
            );

            UserRole::firstOrCreate([
                'user_id' => $marker->id,
                'tournament_id' => $tournament->id,
                'role' => 'marker',
            ]);

            $groupData['marker_id'] = $marker->id;
        } elseif ($request->has('marker_email') && empty($validated['marker_email'])) {
            $groupData['marker_id'] = null;
        }

        $group->update($groupData);

        return back()->with('success', 'Groupe mis à jour.');
    }

    public function destroy(Tournament $tournament, Group $group)
    {
        $group->players()->update(['group_id' => null]);
        $group->delete();

        return back()->with('success', 'Groupe supprimé.');
    }
}
