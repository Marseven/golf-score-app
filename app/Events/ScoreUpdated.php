<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScoreUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public string $tournamentId)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("tournament.{$this->tournamentId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'score.updated';
    }
}
