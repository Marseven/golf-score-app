<?php

namespace App\Http\Controllers;

use App\Imports\PlayersImport;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;

class PlayerImportController extends Controller
{
    public function import(Request $request, Tournament $tournament)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        $countBefore = $tournament->players()->count();

        try {
            Excel::import(new PlayersImport($tournament), $request->file('file'));
            $countAfter = $tournament->players()->count();
            $imported = $countAfter - $countBefore;

            return back()->with('success', $imported.' joueur(s) importé(s) avec succès.');
        } catch (ValidationException $e) {
            $failures = $e->failures();
            $messages = collect($failures)->map(fn ($f) => 'Ligne '.$f->row().': '.$f->errors()[0])->take(10)->toArray();

            return back()->withErrors(['file' => implode(' | ', $messages)]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Erreur d\'import: '.$e->getMessage()]);
        }
    }
}
