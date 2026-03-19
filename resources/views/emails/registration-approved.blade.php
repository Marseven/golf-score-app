<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; }
        .header { background: #1a1a2e; color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; }
        .content { padding: 30px; }
        .success-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .footer { padding: 20px 30px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MGC Score</h1>
        </div>
        <div class="content">
            <h2>Inscription approuvée !</h2>
            <p>Bonjour {{ $player->name }},</p>

            <div class="success-box">
                <p style="margin:0">Votre inscription au tournoi <strong>{{ $tournament->name }}</strong> a été <strong>approuvée</strong>.</p>
            </div>

            <p>Vous êtes désormais inscrit(e) au tournoi. Voici les détails :</p>
            <ul>
                <li><strong>Tournoi :</strong> {{ $tournament->name }}</li>
                <li><strong>Club :</strong> {{ $tournament->club }}</li>
                <li><strong>Date :</strong> {{ $tournament->start_date?->format('d/m/Y') }}</li>
                <li><strong>Catégorie :</strong> {{ $player->category?->name ?? '-' }}</li>
            </ul>

            <p>Les groupes et les heures de départ vous seront communiqués prochainement.</p>

            <p>Cordialement,<br>L'équipe MGC Score</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Manga Golf Club - MGC Score
        </div>
    </div>
</body>
</html>
