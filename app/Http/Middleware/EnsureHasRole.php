<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
            // Check scoped roles (e.g. captain scoped to a tournament)
            if ($user->roles()->where('role', $role)->whereNotNull('tournament_id')->exists()) {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized.');
    }
}
