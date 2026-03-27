<?php

namespace App\Exports;

use App\Models\Tournament;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LeaderboardExport implements FromCollection, WithHeadings, WithMapping
{
    private int $position = 0;

    private Collection $catPars;

    public function __construct(
        protected Tournament $tournament,
        protected ?string $categoryId = null,
        ?Collection $categoryPars = null,
    ) {
        $this->catPars = collect();
        if ($categoryPars) {
            $this->catPars = $categoryPars->keyBy(fn ($r) => $r->category_id.':'.$r->hole_id);
        }
    }

    private function getParForScore($score, ?string $categoryId): int
    {
        if ($categoryId) {
            $key = $categoryId.':'.$score->hole_id;
            $catPar = $this->catPars->get($key);
            if ($catPar) {
                return $catPar->par;
            }
        }

        return $score->hole->par ?? 0;
    }

    public function collection()
    {
        $query = $this->tournament->players()->with('category', 'scores.hole');

        if ($this->categoryId) {
            $query->where('category_id', $this->categoryId);
        }

        $catPars = $this->catPars;

        return $query->get()
            ->sortBy(function ($player) use ($catPars) {
                $totalStrokes = $player->scores->sum('strokes');
                $totalPar = $player->scores->sum(fn ($s) => $this->getParForScore($s, $player->category_id));

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
        $categoryId = $player->category_id;
        $totalStrokes = $scores->sum('strokes');
        $totalPar = $scores->sum(fn ($s) => $this->getParForScore($s, $categoryId));
        $stableford = $scores->sum(fn ($s) => max(0, $this->getParForScore($s, $categoryId) - $s->strokes + 2));

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
