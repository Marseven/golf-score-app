<?php

namespace App\Http\Controllers;

use App\Mail\RegistrationApproved;
use App\Mail\RegistrationConfirmation;
use App\Mail\RegistrationRejected;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function index(Tournament $tournament)
    {
        return Inertia::render('Admin/Registrations', [
            'tournament' => $tournament,
            'players' => $tournament->players()
                ->whereNotNull('email')
                ->with('category', 'payments')
                ->latest()
                ->get(),
        ]);
    }

    public function create(Tournament $tournament)
    {
        if (! $tournament->registration_open || $tournament->status === 'finished') {
            abort(403, 'Les inscriptions sont fermées.');
        }

        return Inertia::render('Registration/Create', [
            'tournament' => $tournament->only('id', 'name', 'start_date', 'end_date', 'club', 'registration_currency'),
            'categories' => $tournament->categories,
        ]);
    }

    public function store(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
            'nationality' => 'nullable|string|max:3',
            'handicap' => 'numeric|min:0|max:54',
            'category_id' => 'required|uuid|exists:categories,id',
            'payment_method' => 'nullable|string|in:ebilling,cash',
        ]);

        $existing = $tournament->players()
            ->where('email', $validated['email'])
            ->where('category_id', $validated['category_id'])
            ->first();

        if ($existing) {
            return back()->withErrors(['email' => 'Vous êtes déjà inscrit(e) dans cette catégorie pour ce tournoi.']);
        }

        $player = $tournament->players()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'nationality' => $validated['nationality'] ?? null,
            'handicap' => $validated['handicap'],
            'category_id' => $validated['category_id'],
            'registration_status' => 'pending',
        ]);

        // Send confirmation email
        if ($player->email) {
            try {
                Mail::to($player->email)->queue(new RegistrationConfirmation($tournament, $player->load('category')));
            } catch (\Exception $e) {
                // Silently fail — email is optional
            }
        }

        $category = $tournament->categories()->find($validated['category_id']);
        $fee = $category ? $category->registration_fee : 0;

        if ($fee > 0) {
            $paymentMethod = $validated['payment_method'] ?? 'ebilling';

            if ($paymentMethod === 'cash') {
                Payment::create([
                    'player_id' => $player->id,
                    'tournament_id' => $tournament->id,
                    'amount' => $fee,
                    'currency' => $tournament->registration_currency,
                    'status' => 'pending',
                    'payment_method' => 'cash',
                ]);

                return redirect()->route('classement')->with('success', 'Inscription enregistrée. Paiement en espèces attendu sur place.');
            }

            return redirect()->route('paiement.create', [$tournament, $player]);
        }

        return redirect()->route('classement')->with('success', 'Inscription enregistrée. En attente de validation.');
    }

    public function update(Request $request, Tournament $tournament, Player $player)
    {
        $validated = $request->validate([
            'registration_status' => 'required|in:approved,rejected',
        ]);

        $player->update($validated);

        // Send notification email
        if ($player->email) {
            try {
                $mailable = $validated['registration_status'] === 'approved'
                    ? new RegistrationApproved($tournament, $player->load('category'))
                    : new RegistrationRejected($tournament, $player);
                Mail::to($player->email)->queue($mailable);
            } catch (\Exception $e) {
                // Silently fail — email is optional
            }
        }

        return back()->with('success', 'Statut mis à jour.');
    }

    public function bulkUpdate(Request $request, Tournament $tournament)
    {
        $validated = $request->validate([
            'registration_status' => 'required|in:approved,rejected',
        ]);

        $count = $tournament->players()
            ->where('registration_status', 'pending')
            ->update(['registration_status' => $validated['registration_status']]);

        $label = $validated['registration_status'] === 'approved' ? 'approuvée(s)' : 'refusée(s)';

        return back()->with('success', $count.' inscription(s) '.$label.'.');
    }
}
