<?php

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Imports\PlayersImport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PlayerImportController extends Controller
{
    public function import(Request $request, Tournament $tournament)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        try {
            Excel::import(new PlayersImport($tournament), $request->file('file'));
            return back()->with('success', 'Joueurs importés avec succès.');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Erreur d\'import: ' . $e->getMessage()]);
        }
    }
}
