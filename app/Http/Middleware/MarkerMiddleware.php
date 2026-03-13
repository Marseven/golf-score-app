<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MarkerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('marker_group_id')) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            return redirect()->route('marqueur.login');
        }

        return $next($request);
    }
}
