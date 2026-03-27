<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TotalEnergiesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Clean tournament-related data (preserve users & roles)
        DB::table('scores')->delete();
        DB::table('payments')->delete();
        DB::table('players')->delete();
        DB::table('groups')->delete();
        DB::table('cuts')->delete();
        if (Schema::hasTable('category_pars')) {
            DB::table('category_pars')->delete();
        }
        if (Schema::hasTable('category_hole')) {
            DB::table('category_hole')->delete();
        }
        DB::table('categories')->delete();
        DB::table('holes')->delete();
        DB::table('courses')->delete();
        DB::table('tournaments')->delete();

        // 2. Create tournament (idempotent)
        $tournament = Tournament::create([
            'name' => 'TOTAL ÉNERGIES',
            'start_date' => '2026-03-28',
            'end_date' => '2026-03-29',
            'club' => 'Manga Golf Club',
            'status' => 'draft',
            'scoring_mode' => 'both',
            'phase_count' => 2,
            'score_aggregation' => 'cumulative',
            'rules' => "Pros : Brut\n1ère série : Strokeplay Net\n2ème et 3ème série : Stableford\nCumul des résultats des deux jours.",
            'registration_open' => false,
            'registration_fee' => 11000,
            'registration_currency' => 'XAF',
        ]);

        // 3. Create category
        $category = Category::create([
            'tournament_id' => $tournament->id,
            'name' => 'Amateur',
            'short_name' => 'AM',
            'color' => '#3b82f6',
            'registration_fee' => 11000,
        ]);

        // 4. Players: [name, handicap, gender]
        $players = [
            ['ABEKE Marcel', 26, 'M'],
            ['ABOLADE Ismael', 35, 'M'],
            ['ABOUMI Kevine', 4, 'F'],
            ['AFOUNA Emmanuel', 20, 'M'],
            ['AGBAGLA Jacques', 30, 'M'],
            ['ALMINANA Franck', 60, 'M'],
            ['ANDOUMBA Felix', 22, 'M'],
            ['ANGOUONO André', 33, 'M'],
            ['ASSILA Marcel', 20, 'M'],
            ['ASSONGHO Clotaire', 13, 'M'],
            ['ASSOUOLO Sleck', 10, 'M'],
            ['AWANI Arnaud', 15, 'M'],
            ['AYO Malicka', 60, 'F'],
            ['BABALAGHA Marius', 8, 'M'],
            ['BATOLO Léod Paul', 20, 'M'],
            ['BIBANGO Aldrin Farrell', 9, 'M'],
            ['BOU Julien', 9, 'M'],
            ['BOU Luca', 21, 'M'],
            ['BOU Raphaël', 23, 'M'],
            ['BOUDZANGA Jean Louis', 28, 'M'],
            ['DIABOUKA Jeniska', 30, 'F'],
            ['DIKANGA Emilia', 18, 'F'],
            ['DIKANGA Junior Masper', 24, 'M'],
            ['DIKANGA Soraya', 60, 'F'],
            ['DJO OBANY BONGO ONDIMBA Anicet', 15, 'M'],
            ['ENGOGO Basile Julo', 17, 'M'],
            ['EYI SAINT DENIS Alain Laurent', 12, 'M'],
            ['FRANCOIS Olivier', 42, 'M'],
            ['GONCALVES Claude', 43, 'M'],
            ['GUIGNON Anthony', 15, 'M'],
            ['GUIGNON Grégory', 14, 'M'],
            ['IHDA Ali', 32, 'M'],
            ['LAUREL Eric', 33, 'M'],
            ['LEBOMO Estimé', 37, 'M'],
            ['LEMDOYE MOMAYA Kévin', 34, 'M'],
            ['LOBO Léon Paul', 16, 'M'],
            ['LOUET Anthony', 23, 'M'],
            ['LOUMBOUT Ferrari', 4, 'M'],
            ['MABENDE Franz Tanguy', 25, 'M'],
            ['MADJIA Annie Clara', 20, 'F'],
            ['MAGNIMA Urbain', 6, 'M'],
            ['MAJIMBO Jammins', 31, 'M'],
            ['MAKAYA Ricardo', 18, 'M'],
            ['MALELA Conchita', 36, 'F'],
            ['MBOUMBA MBOUMBA Dalvy', 18, 'M'],
            ['MIBIÉ Anna', 35, 'F'],
            ['MIDIBA MAGNI Loïc', 28, 'M'],
            ['MOUNGUELE Jean Pierre', 30, 'M'],
            ['MOUPAYA Isidore', 28, 'M'],
            ['MPIA Daniel', 30, 'M'],
            ['MVOULA Etienne', 15, 'M'],
            ['MVOULA Mervyn', 20, 'M'],
            ['NDJENGHA Paul', 29, 'M'],
            ['NDOUNA Amir', 31, 'M'],
            ['NGAKOUSSOU Darel Stevi', 7, 'M'],
            ['NGOUELE ODOUNGA Jeff Danny', 24, 'M'],
            ['NGOULOU Eric Brown', 32, 'M'],
            ['NTOKO Israel', 45, 'M'],
            ['NTOKO Noé', 31, 'M'],
            ['OGOURI David', 6, 'M'],
            ['OKANTSAGUI GOLDMANN Roy Horlait', 11, 'M'],
            ['OKOUMIGUI Henri Claude', 26, 'M'],
            ['OKOUMIGUI Noé', 17, 'M'],
            ['OLLENDE Béranger Carin', 10, 'M'],
            ['ONGASSA Stallone', 6, 'M'],
            ['ONGUINDA ABEKE Brice Hervé', 26, 'M'],
            ['ONKARA Jean Paulin', 11, 'M'],
            ['PECCOUD Vaitiaré', 54, 'F'],
            ['PONCET Marie Cécile', 25, 'F'],
            ['PUHARRE Sebastien', 36, 'M'],
            ['QIN Leo', 30, 'M'],
            ['RICHARD Nill', 17, 'M'],
            ['SMAL Sylvain', 46, 'M'],
            ['VILANOVA Cyrille', 57, 'M'],
            ['VITRE Laurent', 25, 'M'],
            ['WAGA Fernand', 1, 'M'],
            ['YANI Florent', 38, 'M'],
            ['YENO Alain', 49, 'M'],
        ];

        foreach ($players as [$name, $handicap, $gender]) {
            Player::create([
                'tournament_id' => $tournament->id,
                'category_id' => $category->id,
                'name' => $name,
                'gender' => $gender,
                'handicap' => $handicap,
                'registration_status' => 'approved',
            ]);
        }

        $this->command->info("TOTAL ÉNERGIES: {$tournament->id}");
        $this->command->info("Category: Amateur ({$category->id})");
        $this->command->info('Players: '.count($players).' (H: '.collect($players)->where(2, 'M')->count().', F: '.collect($players)->where(2, 'F')->count().')');
    }
}
