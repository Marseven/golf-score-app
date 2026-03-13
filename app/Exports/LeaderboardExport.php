<?php

namespace App\Exports;

use App\Models\Tournament;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LeaderboardExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(protected Tournament $tournament) {}

    public function collection()
    {
        return $this->tournament->players()->with('category', 'scores.hole')->get();
    }

    public function headings(): array
    {
        return ['Position', 'Nom', 'Catégorie', 'Handicap', 'Trous joués', 'Total coups', 'Score vs Par', 'Points Stableford'];
    }

    public function map($player): array
    {
        $scores = $player->scores;
        $totalStrokes = $scores->sum('strokes');
        $totalPar = $scores->sum(fn ($s) => $s->hole->par ?? 0);
        $stableford = $scores->sum(fn ($s) => max(0, ($s->hole->par ?? 0) - $s->strokes + 2));

        static $position = 0;
        $position++;

        return [
            $position,
            $player->name,
            $player->category?->name ?? '-',
            $player->handicap,
            $scores->count(),
            $totalStrokes,
            $totalStrokes - $totalPar,
            $stableford,
        ];
    }
}
