<?php

namespace App\Imports;

use App\Models\Member;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class MembersImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row): Member
    {
        $firstName = $row['first_name'] ?? $row['prenom'] ?? '';
        $lastName = $row['last_name'] ?? $row['nom'] ?? '';
        $email = $row['email'] ?? null;
        $phone = $row['phone'] ?? $row['telephone'] ?? null;
        $handicap = $row['handicap_index'] ?? $row['handicap'] ?? $row['hc'] ?? 54.0;

        return new Member([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'handicap_index' => $handicap,
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required_without:prenom|string',
            'prenom' => 'required_without:first_name|string',
            'last_name' => 'required_without:nom|string',
            'nom' => 'required_without:last_name|string',
        ];
    }
}
