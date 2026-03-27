<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaddyMasterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('caddie_master_tournament_id')) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            return redirect()->route('caddie-master.login');
        }

        return $next($request);
    }
}
