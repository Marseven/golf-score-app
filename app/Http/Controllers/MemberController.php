<?php

namespace App\Http\Controllers;

use App\Imports\MembersImport;
use App\Models\Member;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $members = Member::orderBy('last_name')->orderBy('first_name')->get();

        return Inertia::render('Admin/Members', [
            'members' => $members,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'handicap_index' => 'required|numeric|min:0|max:54',
        ]);

        Member::create($validated);

        return back()->with('success', 'Membre créé avec succès.');
    }

    public function update(Request $request, Member $member)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'handicap_index' => 'required|numeric|min:0|max:54',
            'status' => 'required|in:active,inactive',
        ]);

        $member->update($validated);

        return back()->with('success', 'Membre mis à jour.');
    }

    public function destroy(Member $member)
    {
        $member->delete();

        return back()->with('success', 'Membre supprimé.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls,txt',
        ]);

        Excel::import(new MembersImport, $request->file('file'));

        return back()->with('success', 'Import terminé.');
    }
}
