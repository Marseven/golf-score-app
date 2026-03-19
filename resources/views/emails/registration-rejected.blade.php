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
        .error-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0; }
        .footer { padding: 20px 30px; background: #f9f9f9; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MGC Score</h1>
        </div>
        <div class="content">
            <h2>Inscription refusée</h2>
            <p>Bonjour {{ $player->name }},</p>

            <div class="error-box">
                <p style="margin:0">Nous sommes désolés, votre inscription au tournoi <strong>{{ $tournament->name }}</strong> a été <strong>refusée</strong>.</p>
            </div>

            <p>Pour plus d'informations, veuillez contacter l'organisateur du tournoi.</p>

            <p>Cordialement,<br>L'équipe MGC Score</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Manga Golf Club - MGC Score
        </div>
    </div>
</body>
</html>
