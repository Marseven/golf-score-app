<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MarkerMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $groupIds = $request->session()->get('marker_group_ids', []);
        $singleGroupId = $request->session()->get('marker_group_id');

        // Allow access if the group is in the marker's list of groups
        $group = $request->route('group');
        $requestedGroupId = $group ? (is_string($group) ? $group : $group->id) : null;

        if ($requestedGroupId && in_array($requestedGroupId, $groupIds)) {
            // Update current group in session
            $request->session()->put('marker_group_id', $requestedGroupId);
            return $next($request);
        }

        // Fallback: check single group id
        if ($singleGroupId) {
            return $next($request);
        }

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return redirect()->route('marqueur.login');
    }
}
