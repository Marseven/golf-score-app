<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Group;
use App\Models\Hole;
use App\Models\Player;
use App\Models\Tournament;
use App\Models\User;
use App\Models\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin user
        $admin = User::create([
            'name' => 'Admin Golf',
            'email' => 'admin@golf.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        UserRole::create([
            'user_id' => $admin->id,
            'role' => 'admin',
        ]);

        // 2. Captain user
        $captain = User::create([
            'name' => 'Capitaine Ndong',
            'email' => 'capitaine@golf.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // 3. Tournament
        $tournament = Tournament::create([
            'name' => 'Open de Libreville 2026',
            'start_date' => '2026-04-15',
            'end_date' => '2026-04-17',
            'club' => 'Golf Club de Libreville',
            'status' => 'active',
            'scoring_mode' => 'both',
            'registration_open' => true,
            'registration_fee' => 25000,
            'registration_currency' => 'XAF',
            'created_by' => $admin->id,
        ]);

        // Captain role scoped to tournament
        UserRole::create([
            'user_id' => $captain->id,
            'tournament_id' => $tournament->id,
            'role' => 'captain',
        ]);

        // Marker user
        $marker = User::create([
            'name' => 'Paul',
            'email' => 'paul@test.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        UserRole::create([
            'user_id' => $marker->id,
            'tournament_id' => $tournament->id,
            'role' => 'marker',
        ]);

        // 4. Categories
        $categories = [];
        foreach ([
            ['name' => 'Pro H', 'short_name' => 'PH', 'color' => 'blue'],
            ['name' => 'Pro F', 'short_name' => 'PF', 'color' => 'pink'],
            ['name' => 'Amateur H', 'short_name' => 'AH', 'color' => 'emerald'],
            ['name' => 'Amateur F', 'short_name' => 'AF', 'color' => 'violet'],
        ] as $cat) {
            $categories[$cat['name']] = Category::create([
                'tournament_id' => $tournament->id,
                ...$cat,
            ]);
        }

        // 5. 18 Holes (par 72 standard)
        $pars = [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
        $distances = [380, 165, 510, 405, 370, 190, 420, 530, 395, 410, 175, 520, 385, 400, 180, 430, 540, 390];
        foreach ($pars as $i => $par) {
            Hole::create([
                'tournament_id' => $tournament->id,
                'number' => $i + 1,
                'par' => $par,
                'distance' => $distances[$i],
                'hole_index' => $i + 1,
            ]);
        }

        // 6. Groups
        $group1 = Group::create([
            'tournament_id' => $tournament->id,
            'code' => 'GOLF-2026-G1',
            'tee_time' => '08:00',
            'marker_id' => $marker->id,
        ]);

        $group2 = Group::create([
            'tournament_id' => $tournament->id,
            'code' => 'GOLF-2026-G2',
            'tee_time' => '08:15',
        ]);

        $group3 = Group::create([
            'tournament_id' => $tournament->id,
            'code' => 'GOLF-2026-G3',
            'tee_time' => '08:30',
        ]);

        // 7. Players (12 joueurs gabonais)
        $playersData = [
            ['name' => 'Jean-Pierre Nzé', 'handicap' => 5.2, 'category' => 'Pro H', 'group' => $group1],
            ['name' => 'Paul Ondo Mba', 'handicap' => 8.1, 'category' => 'Pro H', 'group' => $group1],
            ['name' => 'Marie Nguema', 'handicap' => 12.4, 'category' => 'Pro F', 'group' => $group1],
            ['name' => 'David Obiang', 'handicap' => 3.8, 'category' => 'Pro H', 'group' => $group2],
            ['name' => 'Sophie Mboumba', 'handicap' => 15.0, 'category' => 'Pro F', 'group' => $group2],
            ['name' => 'Eric Moussavou', 'handicap' => 18.5, 'category' => 'Amateur H', 'group' => $group2],
            ['name' => 'André Mintsa', 'handicap' => 22.0, 'category' => 'Amateur H', 'group' => $group2],
            ['name' => 'Claire Bekale', 'handicap' => 20.3, 'category' => 'Amateur F', 'group' => $group3],
            ['name' => 'Alain Ntoutoume', 'handicap' => 10.7, 'category' => 'Pro H', 'group' => $group3],
            ['name' => 'Florence Oyane', 'handicap' => 25.0, 'category' => 'Amateur F', 'group' => $group3],
            ['name' => 'Michel Essono', 'handicap' => 16.2, 'category' => 'Amateur H', 'group' => $group1],
            ['name' => 'Jeanne Mba Abogo', 'handicap' => 14.8, 'category' => 'Pro F', 'group' => $group3],
        ];

        foreach ($playersData as $pd) {
            Player::create([
                'tournament_id' => $tournament->id,
                'category_id' => $categories[$pd['category']]->id,
                'group_id' => $pd['group']->id,
                'name' => $pd['name'],
                'handicap' => $pd['handicap'],
                'registration_status' => 'approved',
            ]);
        }
    }
}
