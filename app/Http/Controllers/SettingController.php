<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $sharedKey = Setting::getValue('ebilling_shared_key', '');

        return Inertia::render('Admin/Settings', [
            'settings' => [
                'ebilling_username' => Setting::getValue('ebilling_username', ''),
                'ebilling_shared_key' => $sharedKey ? '••••'.substr($sharedKey, -4) : '',
                'ebilling_shared_key_set' => ! empty($sharedKey),
                'ebilling_environment' => Setting::getValue('ebilling_environment', 'lab'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'ebilling_username' => 'required|string|max:255',
            'ebilling_shared_key' => 'nullable|string|max:255',
            'ebilling_environment' => 'required|in:lab,prod',
        ]);

        Setting::setValue('ebilling_username', $validated['ebilling_username']);
        Setting::setValue('ebilling_environment', $validated['ebilling_environment']);

        // Only update shared key if a new value was provided (not the masked placeholder)
        if (! empty($validated['ebilling_shared_key']) && ! str_starts_with($validated['ebilling_shared_key'], '••••')) {
            Setting::setValue('ebilling_shared_key', $validated['ebilling_shared_key']);
        }

        return redirect()->route('admin.settings')->with('success', 'Paramètres sauvegardés.');
    }
}
