<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reçu de paiement - {{ $payment->id }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 22px; margin-bottom: 5px; color: #1a1a2e; }
        .header p { color: #666; margin: 0; }
        .receipt-box { border: 2px solid #1a1a2e; border-radius: 8px; padding: 25px; margin: 20px 0; }
        .receipt-title { font-size: 16px; font-weight: bold; color: #1a1a2e; margin-bottom: 20px; text-align: center; text-transform: uppercase; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #555; }
        .value { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; }
        td.label { font-weight: bold; color: #555; width: 40%; }
        .amount { font-size: 18px; font-weight: bold; color: #1a1a2e; text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; margin-top: 15px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-completed { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-failed { background: #fecaca; color: #991b1b; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Manga Golf Club</h1>
        <p>MGC Score - Reçu de paiement</p>
    </div>

    <div class="receipt-box">
        <div class="receipt-title">Reçu de paiement</div>

        <table>
            <tr>
                <td class="label">Référence</td>
                <td>{{ strtoupper(substr($payment->id, 0, 8)) }}</td>
            </tr>
            <tr>
                <td class="label">Date</td>
                <td>{{ $payment->updated_at?->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td class="label">Statut</td>
                <td>
                    <span class="status status-{{ $payment->status }}">
                        {{ $payment->status === 'completed' ? 'Payé' : ($payment->status === 'pending' ? 'En attente' : 'Échoué') }}
                    </span>
                </td>
            </tr>
            <tr>
                <td class="label">Joueur</td>
                <td>{{ $player->name }}</td>
            </tr>
            <tr>
                <td class="label">Email</td>
                <td>{{ $player->email ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Tournoi</td>
                <td>{{ $tournament->name }}</td>
            </tr>
            <tr>
                <td class="label">Club</td>
                <td>{{ $tournament->club }}</td>
            </tr>
            <tr>
                <td class="label">Date du tournoi</td>
                <td>{{ $tournament->start_date?->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label">Catégorie</td>
                <td>{{ $player->category?->name ?? '-' }}</td>
            </tr>
            @if($payment->ebilling_reference)
            <tr>
                <td class="label">Réf. eBilling</td>
                <td>{{ $payment->ebilling_reference }}</td>
            </tr>
            @endif
        </table>

        <div class="amount">
            {{ number_format($payment->amount, 0, ',', ' ') }} {{ $payment->currency }}
        </div>
    </div>

    <div class="footer">
        MGC Score - Généré le {{ now()->format('d/m/Y H:i') }}<br>
        Ce document est un reçu de paiement et ne constitue pas une facture.
    </div>
</body>
</html>
