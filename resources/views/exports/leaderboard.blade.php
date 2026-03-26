<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Classement - {{ $tournament->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #1a1a2e; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; text-align: center; }
    </style>
</head>
<body>
    <h1>{{ $tournament->name }}</h1>
    <p class="subtitle">{{ $tournament->club }} - {{ $tournament->start_date?->format('d/m/Y') }}@if($tournament->end_date && $tournament->end_date->ne($tournament->start_date)) – {{ $tournament->end_date->format('d/m/Y') }}@endif</p>
    @if(!empty($categoryName))
        <p class="subtitle" style="font-weight: bold; color: #333;">Catégorie : {{ $categoryName }}</p>
    @endif

    <table>
        <thead>
            <tr>
                <th>Pos</th>
                <th>Joueur</th>
                <th>Catégorie</th>
                <th>HC</th>
                <th>Trous</th>
                <th>Total</th>
                <th>Score</th>
                <th>Stableford</th>
            </tr>
        </thead>
        <tbody>
            @php $position = 0; @endphp
            @foreach ($players->sortBy(fn($p) => $p->scores->sum('strokes') - $p->scores->sum(fn($s) => optional($s->hole)->par ?? 0)) as $player)
                @php
                    $position++;
                    $totalStrokes = $player->scores->sum('strokes');
                    $totalPar = $player->scores->sum(fn($s) => optional($s->hole)->par ?? 0);
                    $strokeToPar = $totalStrokes - $totalPar;
                    $stableford = $player->scores->sum(fn($s) => max(0, (optional($s->hole)->par ?? 0) - $s->strokes + 2));
                @endphp
                <tr>
                    <td>{{ $position }}</td>
                    <td>{{ $player->name }}</td>
                    <td>{{ $player->category?->name ?? '-' }}</td>
                    <td>{{ $player->handicap }}</td>
                    <td>{{ $player->scores->count() }}/18</td>
                    <td>{{ $totalStrokes }}</td>
                    <td>{{ $strokeToPar === 0 ? 'E' : ($strokeToPar > 0 ? '+' : '') . $strokeToPar }}</td>
                    <td>{{ $stableford }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        MGC Score - Généré le {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
