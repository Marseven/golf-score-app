<?php

namespace App\Exports;

use App\Models\Tournament;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LeaderboardExport implements FromCollection, WithHeadings, WithMapping
{
    private int $position = 0;

    public function __construct(protected Tournament $tournament) {}

    public function collection()
    {
        return $this->tournament->players()->with('category', 'scores.hole')->get()
            ->sortBy(function ($player) {
                $totalStrokes = $player->scores->sum('strokes');
                $totalPar = $player->scores->sum(fn ($s) => $s->hole->par ?? 0);

                return $totalStrokes - $totalPar;
            })->values();
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

        $this->position++;

        return [
            $this->position,
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
