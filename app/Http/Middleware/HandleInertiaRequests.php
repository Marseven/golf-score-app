<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()
                    ? $request->user()->roles->pluck('role')->unique()->values()
                    : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'logo_url' => function () {
                try {
                    $path = Setting::getValue('logo_path');

                    return $path ? Storage::disk('public')->url($path) : null;
                } catch (\Throwable) {
                    return null;
                }
            },
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'url' => config('app.url'),
            ],
        ];
    }
}
