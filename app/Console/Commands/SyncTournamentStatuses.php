<?php

namespace App\Console\Commands;

use App\Models\Tournament;
use Illuminate\Console\Command;

class SyncTournamentStatuses extends Command
{
    protected $signature = 'tournaments:sync-statuses';

    protected $description = 'Sync tournament statuses based on start_date and end_date';

    public function handle(): int
    {
        $updated = 0;

        Tournament::whereIn('status', ['active', 'draft'])
            ->each(function (Tournament $tournament) use (&$updated) {
                if ($tournament->syncStatus()) {
                    $updated++;
                    $this->line("Updated {$tournament->name} → {$tournament->status}");
                }
            });

        $this->info("{$updated} tournament(s) updated.");

        return self::SUCCESS;
    }
}
