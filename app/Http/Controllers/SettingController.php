<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $sharedKey = Setting::getValue('ebilling_shared_key', '');
        $mailPassword = Setting::getValue('mail_password', '');
        $logoPath = Setting::getValue('logo_path');

        return Inertia::render('Admin/Settings', [
            'settings' => [
                // General
                'platform_name' => Setting::getValue('platform_name', 'MGC Score'),
                'club_name' => Setting::getValue('club_name', 'Manga Golf Club'),
                'club_email' => Setting::getValue('club_email', ''),
                'club_phone' => Setting::getValue('club_phone', ''),
                'logo_url' => $logoPath ? Storage::disk('public')->url($logoPath) : null,

                // Email SMTP
                'mail_from_address' => Setting::getValue('mail_from_address', ''),
                'mail_from_name' => Setting::getValue('mail_from_name', ''),
                'mail_host' => Setting::getValue('mail_host', ''),
                'mail_port' => Setting::getValue('mail_port', '587'),
                'mail_username' => Setting::getValue('mail_username', ''),
                'mail_password' => $mailPassword ? '********' : '',
                'mail_password_set' => ! empty($mailPassword),
                'mail_encryption' => Setting::getValue('mail_encryption', 'tls'),

                // Payment (eBilling)
                'ebilling_username' => Setting::getValue('ebilling_username', ''),
                'ebilling_shared_key' => $sharedKey ? '••••'.substr($sharedKey, -4) : '',
                'ebilling_shared_key_set' => ! empty($sharedKey),
                'ebilling_environment' => Setting::getValue('ebilling_environment', 'lab'),

                // Tournaments defaults
                'default_currency' => Setting::getValue('default_currency', 'XAF'),
                'default_scoring_mode' => Setting::getValue('default_scoring_mode', 'stroke_play'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $section = $request->input('section', 'payment');

        switch ($section) {
            case 'general':
                $validated = $request->validate([
                    'platform_name' => 'required|string|max:255',
                    'club_name' => 'required|string|max:255',
                    'club_email' => 'nullable|email|max:255',
                    'club_phone' => 'nullable|string|max:50',
                ]);

                Setting::setValue('platform_name', $validated['platform_name']);
                Setting::setValue('club_name', $validated['club_name']);
                Setting::setValue('club_email', $validated['club_email'] ?? '');
                Setting::setValue('club_phone', $validated['club_phone'] ?? '');
                break;

            case 'email':
                $validated = $request->validate([
                    'mail_from_address' => 'nullable|email|max:255',
                    'mail_from_name' => 'nullable|string|max:255',
                    'mail_host' => 'nullable|string|max:255',
                    'mail_port' => 'nullable|string|max:10',
                    'mail_username' => 'nullable|string|max:255',
                    'mail_password' => 'nullable|string|max:255',
                    'mail_encryption' => 'nullable|in:tls,ssl,none',
                ]);

                Setting::setValue('mail_from_address', $validated['mail_from_address'] ?? '');
                Setting::setValue('mail_from_name', $validated['mail_from_name'] ?? '');
                Setting::setValue('mail_host', $validated['mail_host'] ?? '');
                Setting::setValue('mail_port', $validated['mail_port'] ?? '587');
                Setting::setValue('mail_username', $validated['mail_username'] ?? '');
                Setting::setValue('mail_encryption', $validated['mail_encryption'] ?? 'tls');

                // Only update password if not the placeholder
                if (! empty($validated['mail_password']) && $validated['mail_password'] !== '********') {
                    Setting::setValue('mail_password', $validated['mail_password']);
                }
                break;

            case 'payment':
                $validated = $request->validate([
                    'ebilling_username' => 'required|string|max:255',
                    'ebilling_shared_key' => 'nullable|string|max:255',
                    'ebilling_environment' => 'required|in:lab,prod',
                ]);

                Setting::setValue('ebilling_username', $validated['ebilling_username']);
                Setting::setValue('ebilling_environment', $validated['ebilling_environment']);

                if (! empty($validated['ebilling_shared_key']) && ! str_starts_with($validated['ebilling_shared_key'], '••••')) {
                    Setting::setValue('ebilling_shared_key', $validated['ebilling_shared_key']);
                }
                break;

            case 'tournaments':
                $validated = $request->validate([
                    'default_currency' => 'required|in:XAF,EUR,USD',
                    'default_scoring_mode' => 'required|in:stroke_play,stableford,both',
                ]);

                Setting::setValue('default_currency', $validated['default_currency']);
                Setting::setValue('default_scoring_mode', $validated['default_scoring_mode']);
                break;
        }

        return redirect()->route('admin.settings')->with('success', 'Paramètres sauvegardés.');
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:2048',
        ]);

        $oldPath = Setting::getValue('logo_path');
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('logo')->store('logos', 'public');
        Setting::setValue('logo_path', $path);

        return redirect()->route('admin.settings')->with('success', 'Logo mis à jour.');
    }
}
