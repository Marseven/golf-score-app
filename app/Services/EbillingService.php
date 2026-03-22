<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Player;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EbillingService
{
    protected string $username;

    protected string $sharedKey;

    protected string $environment;

    protected string $apiUrl;

    protected string $portalUrl;

    public function __construct()
    {
        $this->username = Setting::getValue('ebilling_username') ?? config('services.ebilling.username', '');
        $this->sharedKey = Setting::getValue('ebilling_shared_key') ?? config('services.ebilling.shared_key', '');
        $this->environment = Setting::getValue('ebilling_environment') ?? config('services.ebilling.environment', 'lab');

        $urls = config('services.ebilling.urls.'.$this->environment);
        $this->apiUrl = $urls['api'] ?? '';
        $this->portalUrl = $urls['portal'] ?? '';
    }

    public function isConfigured(): bool
    {
        return ! empty($this->username) && ! empty($this->sharedKey);
    }

    public function initiatePayment(Payment $payment, Player $player, ?string $payerMsisdn = null): array
    {
        $msisdn = ltrim($payerMsisdn ?? $player->phone ?? '', '+');

        $response = Http::withBasicAuth($this->username, $this->sharedKey)
            ->accept('application/json')
            ->post($this->apiUrl.'/api/v1/merchant/e_bills', [
                'payer_msisdn' => $msisdn,
                'payer_email' => $player->email ?? '',
                'payer_name' => $player->name,
                'amount' => (int) $payment->amount,
                'external_reference' => $payment->id,
                'short_description' => 'Inscription '.$payment->tournament->name,
                'expiry_period' => 72,
            ]);

        if (! $response->successful()) {
            Log::error('eBilling API error', [
                'status' => $response->status(),
                'body' => $response->body(),
                'headers' => $response->headers(),
                'payment_id' => $payment->id,
                'api_url' => $this->apiUrl,
                'payer_msisdn' => $msisdn,
                'amount' => (int) $payment->amount,
            ]);
            throw new \RuntimeException('eBilling API error: '.$response->status());
        }

        $data = $response->json();
        $billId = $data['e_bill']['bill_id'] ?? $data['bill_id'] ?? null;

        if (! $billId) {
            Log::error('eBilling: no bill_id in response', ['data' => $data, 'payment_id' => $payment->id]);
            throw new \RuntimeException('eBilling: no bill_id returned');
        }

        $redirectUrl = route('paiement.status', $payment->id);
        $paymentUrl = $this->portalUrl.'?invoice='.$billId.'&redirect_url='.urlencode($redirectUrl);

        return [
            'bill_id' => $billId,
            'payment_url' => $paymentUrl,
            'reference' => $data['e_bill']['reference'] ?? $data['reference'] ?? $billId,
        ];
    }

    public function handleCallback(array $data): void
    {
        $billId = $data['billingid'] ?? $data['bill_id'] ?? null;
        $reference = $data['reference'] ?? null;

        $payment = null;
        if ($billId) {
            $payment = Payment::where('ebilling_reference', $billId)->first();
        }
        if (! $payment && $reference) {
            $payment = Payment::where('ebilling_reference', $reference)->first();
        }
        // Also try matching by external_reference (payment UUID)
        $externalRef = $data['external_reference'] ?? null;
        if (! $payment && $externalRef) {
            $payment = Payment::find($externalRef);
        }

        if (! $payment) {
            Log::warning('eBilling callback: payment not found', $data);

            return;
        }

        $transactionId = $data['transactionid'] ?? $data['transaction_id'] ?? null;
        $status = ! empty($transactionId) ? 'completed' : 'failed';

        $payment->update([
            'status' => $status,
            'metadata' => array_merge($payment->metadata ?? [], $data),
        ]);

        if ($status === 'completed') {
            $payment->player->update(['registration_status' => 'approved']);
        }

        Log::info('eBilling callback processed', [
            'payment_id' => $payment->id,
            'status' => $status,
            'transaction_id' => $transactionId,
        ]);
    }
}
