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
        'code',
        'tee_time',
        'marker_id',
        'marker_token',
    ];

    protected static function booted(): void
    {
        static::creating(function (Group $group) {
            if (!$group->marker_token) {
                $group->marker_token = Str::random(64);
            }
        });
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
     * Get the marker (user) assigned to this group.
     */
    public function marker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marker_id');
    }
}
