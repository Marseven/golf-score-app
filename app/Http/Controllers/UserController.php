<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['roles' => function ($query) {
            $query->whereNull('tournament_id');
        }])->orderBy('name')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
                'roles' => $user->roles->pluck('role')->unique()->values(),
                'hole_start' => $user->hole_start ?? 1,
                'hole_end' => $user->hole_end ?? 18,
            ];
        });

        return Inertia::render('Admin/Users', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::defaults()],
            'roles' => 'array',
            'roles.*' => 'in:admin,captain,marker',
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

        if (! empty($validated['roles'])) {
            foreach ($validated['roles'] as $role) {
                UserRole::create([
                    'user_id' => $user->id,
                    'tournament_id' => null,
                    'role' => $role,
                ]);
            }
        }

        return back()->with('success', 'Utilisateur créé avec succès.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'password' => ['nullable', Password::defaults()],
            'roles' => 'array',
            'roles.*' => 'in:admin,captain,marker',
            'hole_start' => 'integer|min:1|max:18',
            'hole_end' => 'integer|min:1|max:18',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'hole_start' => $validated['hole_start'] ?? $user->hole_start,
            'hole_end' => $validated['hole_end'] ?? $user->hole_end,
        ]);

        if (! empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        // Sync global roles (tournament_id = null)
        $user->roles()->whereNull('tournament_id')->delete();

        if (! empty($validated['roles'])) {
            foreach ($validated['roles'] as $role) {
                UserRole::create([
                    'user_id' => $user->id,
                    'tournament_id' => null,
                    'role' => $role,
                ]);
            }
        }

        return back()->with('success', 'Utilisateur mis à jour.');
    }

    public function regeneratePin(User $user)
    {
        // Get all tournaments where this user is a marker
        $tournamentIds = \DB::table('group_marker')
            ->join('groups', 'groups.id', '=', 'group_marker.group_id')
            ->where('group_marker.user_id', $user->id)
            ->pluck('groups.tournament_id')
            ->unique();

        $newPins = [];
        foreach ($tournamentIds as $tid) {
            $newPin = \App\Models\Group::generateUniquePin($tid);

            // Update pivot table
            \DB::table('group_marker')
                ->join('groups', 'groups.id', '=', 'group_marker.group_id')
                ->where('groups.tournament_id', $tid)
                ->where('group_marker.user_id', $user->id)
                ->update(['group_marker.marker_pin' => $newPin]);

            // Update legacy marker_pin
            \App\Models\Group::where('tournament_id', $tid)
                ->where('marker_id', $user->id)
                ->update(['marker_pin' => $newPin]);

            $newPins[] = $newPin;
        }

        $pinStr = implode(', ', $newPins);

        return back()->with('success', "PIN régénéré pour {$user->name} : {$pinStr}");
    }

    public function destroy(User $user, Request $request)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Vous ne pouvez pas supprimer votre propre compte.');
        }

        $user->roles()->delete();
        $user->delete();

        return back()->with('success', 'Utilisateur supprimé.');
    }
}
