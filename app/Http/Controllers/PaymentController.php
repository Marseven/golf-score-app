<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Player;
use App\Models\Tournament;
use App\Services\EbillingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function create(Tournament $tournament, Player $player)
    {
        $ebilling = app(EbillingService::class);
        $player->load('category');
        $fee = $player->category ? $player->category->registration_fee : 0;

        return Inertia::render('Registration/Payment', [
            'tournament' => $tournament->only('id', 'name', 'registration_currency'),
            'player' => $player->only('id', 'name', 'email', 'phone'),
            'registrationFee' => $fee,
            'ebillingConfigured' => $ebilling->isConfigured(),
        ]);
    }

    public function store(Request $request, Tournament $tournament, Player $player)
    {
        $validated = $request->validate([
            'payer_msisdn' => 'required|string|max:20',
        ]);

        $player->load('category');
        $fee = $player->category ? $player->category->registration_fee : 0;

        $payment = Payment::create([
            'player_id' => $player->id,
            'tournament_id' => $tournament->id,
            'amount' => $fee,
            'currency' => $tournament->registration_currency,
            'status' => 'pending',
            'payment_method' => 'ebilling',
        ]);

        try {
            $ebilling = app(EbillingService::class);
            $result = $ebilling->initiatePayment($payment, $player, $validated['payer_msisdn']);

            $payment->update([
                'ebilling_reference' => $result['bill_id'] ?? null,
                'metadata' => $result,
            ]);

            if (isset($result['payment_url'])) {
                return Inertia::location($result['payment_url']);
            }
        } catch (\Exception $e) {
            $payment->update(['status' => 'failed']);

            return back()->withErrors(['payment' => 'Erreur de paiement: '.$e->getMessage()]);
        }

        return redirect()->route('paiement.status', $payment->id);
    }

    public function status(Payment $payment)
    {
        $payment->load(['player', 'tournament']);

        return Inertia::render('Registration/PaymentStatus', [
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
            ],
            'tournament' => $payment->tournament->only('id', 'name'),
            'player' => $payment->player->only('id', 'name'),
        ]);
    }

    public function markCompleted(Request $request, Tournament $tournament, Payment $payment)
    {
        $payment->update(['status' => 'completed']);

        // Auto-approve player
        if ($payment->player) {
            $payment->player->update(['registration_status' => 'approved']);
        }

        return back()->with('success', 'Paiement marqué comme reçu.');
    }

    public function receipt(Tournament $tournament, Payment $payment)
    {
        $payment->load(['player.category', 'tournament']);

        $pdf = Pdf::loadView('exports.receipt', [
            'payment' => $payment,
            'player' => $payment->player,
            'tournament' => $payment->tournament,
        ]);

        $ref = strtoupper(substr($payment->id, 0, 8));

        return $pdf->download("recu-{$ref}.pdf");
    }

    public function callback(Request $request)
    {
        $ebilling = app(EbillingService::class);
        $ebilling->handleCallback($request->all());

        return response()->json(['status' => 'ok']);
    }
}
