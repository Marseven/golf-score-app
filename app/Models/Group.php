<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Group extends Model
{
    use HasFactory, HasUuids;

    /**
     * Indicates that the IDs are not auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tournament_id',
        'phase',
        'category_id',
        'code',
        'tee_time',
        'marker_id',
        'marker_phone',
        'marker_token',
        'marker_pin',
        'tee_date',
        'scores_confirmed_at',
        'confirmed_by_name',
    ];

    protected function casts(): array
    {
        return [
            'phase' => 'integer',
            'tee_date' => 'date',
            'scores_confirmed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Group $group) {
            if (! $group->marker_token) {
                $group->marker_token = Str::random(64);
            }
            if (! $group->marker_pin && $group->tournament_id) {
                $group->marker_pin = static::generateUniquePin($group->tournament_id);
            }
        });
    }

    /**
     * Generate a unique 4-digit PIN for a tournament.
     */
    public static function generateUniquePin(string $tournamentId): string
    {
        do {
            $pin = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        } while (static::where('tournament_id', $tournamentId)->where('marker_pin', $pin)->exists());

        return $pin;
    }

    /**
     * Get the tournament that the group belongs to.
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Get the players in this group.
     */
    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    /**
     * Get the category of this group.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the marker (user) assigned to this group.
     */
    public function marker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marker_id');
    }
}
