<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\Player;
use App\Models\Payment;
use App\Services\EbillingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function create(Tournament $tournament, Player $player)
    {
        return Inertia::render('Registration/Payment', [
            'tournament' => $tournament->only('id', 'name', 'registration_fee', 'registration_currency'),
            'player' => $player->only('id', 'name', 'email'),
        ]);
    }

    public function store(Request $request, Tournament $tournament, Player $player)
    {
        $payment = Payment::create([
            'player_id' => $player->id,
            'tournament_id' => $tournament->id,
            'amount' => $tournament->registration_fee,
            'currency' => $tournament->registration_currency,
            'status' => 'pending',
        ]);

        try {
            $ebilling = app(EbillingService::class);
            $result = $ebilling->initiatePayment($payment, $player);

            $payment->update([
                'ebilling_reference' => $result['reference'] ?? null,
                'metadata' => $result,
            ]);

            if (isset($result['payment_url'])) {
                return Inertia::location($result['payment_url']);
            }
        } catch (\Exception $e) {
            $payment->update(['status' => 'failed']);
            return back()->withErrors(['payment' => 'Erreur de paiement: ' . $e->getMessage()]);
        }

        return redirect()->route('classement')->with('success', 'Paiement en cours de traitement.');
    }

    public function callback(Request $request)
    {
        $ebilling = app(EbillingService::class);
        $ebilling->handleCallback($request->all());

        return response()->json(['status' => 'ok']);
    }
}
