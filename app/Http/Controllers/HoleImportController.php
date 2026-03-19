<?php

namespace App\Http\Controllers;

use App\Imports\HolesImport;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class HoleImportController extends Controller
{
    public function import(Request $request, Tournament $tournament)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        try {
            Excel::import(new HolesImport($tournament), $request->file('file'));

            return back()->with('success', 'Parcours importé avec succès.');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Erreur d\'import: '.$e->getMessage()]);
        }
    }
}
