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
            $request->session()->put('marker_group_id', $requestedGroupId);
            return $next($request);
        }

        // Fallback: check single group id
        if ($singleGroupId) {
            return $next($request);
        }

        // For JSON/AJAX requests, return 401 instead of redirect
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['message' => 'Session expirée'], 401);
        }

        return redirect()->route('marqueur.login');
    }
}
