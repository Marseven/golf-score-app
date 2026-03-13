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
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
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
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
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
