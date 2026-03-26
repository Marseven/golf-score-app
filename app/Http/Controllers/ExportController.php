<?php

namespace App\Http\Controllers;

use App\Exports\LeaderboardExport;
use App\Models\Tournament;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    public function pdf(Request $request, Tournament $tournament)
    {
        $tournament->load(['holes', 'categories']);
        $categoryId = $request->query('category_id');

        $playersQuery = $tournament->players()->with(['category', 'scores.hole']);
        if ($categoryId) {
            $playersQuery->where('category_id', $categoryId);
        }
        $players = $playersQuery->get();

        $scores = $tournament->scores()->get();
        $categoryName = $categoryId
            ? $tournament->categories->firstWhere('id', $categoryId)?->name
            : null;

        $pdf = Pdf::loadView('exports.leaderboard', [
            'tournament' => $tournament,
            'players' => $players,
            'scores' => $scores,
            'holes' => $tournament->holes,
            'categories' => $tournament->categories,
            'categoryName' => $categoryName,
        ]);

        $suffix = $categoryName ? "-{$categoryName}" : '';

        return $pdf->download("classement-{$tournament->name}{$suffix}.pdf");
    }

    public function excel(Request $request, Tournament $tournament)
    {
        $categoryId = $request->query('category_id');

        return Excel::download(
            new LeaderboardExport($tournament, $categoryId),
            "classement-{$tournament->name}.xlsx"
        );
    }
}
