<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Exports\LeaderboardExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    public function pdf(Tournament $tournament)
    {
        $tournament->load(['players.category', 'holes', 'categories']);
        $scores = $tournament->scores()->get();

        $pdf = Pdf::loadView('exports.leaderboard', [
            'tournament' => $tournament,
            'players' => $tournament->players,
            'scores' => $scores,
            'holes' => $tournament->holes,
            'categories' => $tournament->categories,
        ]);

        return $pdf->download("classement-{$tournament->name}.pdf");
    }

    public function excel(Tournament $tournament)
    {
        return Excel::download(
            new LeaderboardExport($tournament),
            "classement-{$tournament->name}.xlsx"
        );
    }
}
