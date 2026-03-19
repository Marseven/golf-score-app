<?php

namespace App\Mail;

use App\Models\Player;
use App\Models\Tournament;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationRejected extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Tournament $tournament,
        public Player $player,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Inscription refusée - '.$this->tournament->name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.registration-rejected',
        );
    }
}
