<?php

namespace App\Imports;

use App\Models\Player;
use App\Models\Tournament;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class PlayersImport implements ToModel, WithHeadingRow, WithValidation
{
    public function __construct(protected Tournament $tournament) {}

    public function model(array $row): Player
    {
        $name = $row['name'] ?? $row['nom'] ?? '';
        $handicap = $row['handicap'] ?? $row['hc'] ?? 0;
        $email = $row['email'] ?? null;
        $phone = $row['phone'] ?? $row['telephone'] ?? $row['tel'] ?? null;

        $categoryName = $row['category'] ?? $row['categorie'] ?? null;
        $category = null;
        if ($categoryName) {
            $category = $this->tournament->categories()
                ->where(fn ($q) => $q->where('name', $categoryName)->orWhere('short_name', $categoryName))
                ->first();
        }

        return new Player([
            'tournament_id' => $this->tournament->id,
            'name' => $name,
            'handicap' => $handicap,
            'email' => $email,
            'phone' => $phone,
            'category_id' => $category?->id,
            'registration_status' => 'approved',
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => 'required_without:nom|string',
            'nom' => 'required_without:name|string',
        ];
    }
}
