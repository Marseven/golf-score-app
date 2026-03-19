<?php

namespace App\Http\Controllers;

use App\Imports\HolesImport;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Validators\ValidationException;

class HoleImportController extends Controller
{
    public function import(Request $request, Tournament $tournament)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        try {
            Excel::import(new HolesImport($tournament), $request->file('file'));

            return back()->with('success', 'Parcours mis à jour avec succès.');
        } catch (ValidationException $e) {
            $failures = $e->failures();
            $messages = collect($failures)->map(fn ($f) => 'Ligne '.$f->row().': '.$f->errors()[0])->take(10)->toArray();

            return back()->withErrors(['file' => implode(' | ', $messages)]);
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Erreur d\'import: '.$e->getMessage()]);
        }
    }
}
