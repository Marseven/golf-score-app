<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Player;

class EbillingService
{
    public function __construct(
        protected string $apiKey = '',
        protected string $apiUrl = '',
    ) {
        $this->apiKey = config('services.ebilling.key', '');
        $this->apiUrl = config('services.ebilling.url', '');
    }

    public function initiatePayment(Payment $payment, Player $player): array
    {
        // TODO: Implement actual Ebilling API call
        // This is a placeholder for the Ebilling integration
        return [
            'reference' => 'EB-' . strtoupper(substr(md5($payment->id), 0, 8)),
            'status' => 'pending',
        ];
    }

    public function verifyPayment(string $reference): array
    {
        // TODO: Implement actual verification
        return ['status' => 'pending'];
    }

    public function handleCallback(array $data): void
    {
        $reference = $data['reference'] ?? null;
        if (!$reference) return;

        $payment = Payment::where('ebilling_reference', $reference)->first();
        if (!$payment) return;

        $status = ($data['status'] ?? '') === 'SUCCESS' ? 'completed' : 'failed';
        $payment->update([
            'status' => $status,
            'metadata' => array_merge($payment->metadata ?? [], $data),
        ]);

        if ($status === 'completed') {
            $payment->player->update(['registration_status' => 'approved']);
        }
    }
}
