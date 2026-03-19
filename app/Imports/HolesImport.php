<?php

namespace App\Imports;

use App\Models\Tournament;
use Illuminate\Database\Eloquent\Model;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class HolesImport implements ToModel, WithHeadingRow, WithValidation
{
    public function __construct(protected Tournament $tournament) {}

    public function model(array $row): ?Model
    {
        $number = $row['number'] ?? $row['trou'] ?? null;
        $par = $row['par'] ?? null;
        $distance = $row['distance'] ?? 0;
        $holeIndex = $row['index'] ?? $row['hole_index'] ?? null;

        if (! $number) {
            return null;
        }

        $hole = $this->tournament->holes()->where('number', (int) $number)->first();

        if (! $hole) {
            return null;
        }

        $hole->update(array_filter([
            'par' => $par !== null ? (int) $par : null,
            'distance' => (int) $distance,
            'hole_index' => $holeIndex !== null ? (int) $holeIndex : null,
        ], fn ($v) => $v !== null));

        return null;
    }

    public function rules(): array
    {
        return [
            'number' => 'required_without:trou|integer|between:1,18',
            'trou' => 'required_without:number|integer|between:1,18',
            'par' => 'required|integer|between:3,5',
            'distance' => 'nullable|integer|min:0',
            'index' => 'nullable|integer|between:1,18',
            'hole_index' => 'nullable|integer|between:1,18',
        ];
    }
}
