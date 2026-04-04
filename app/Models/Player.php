<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
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
        'category_id',
        'group_id',
        'user_id',
        'name',
        'gender',
        'nationality',
        'email',
        'phone',
        'handicap',
        'registration_status',
        'cut_after_phase',
        'is_withdrawn',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'handicap' => 'decimal:1',
            'cut_after_phase' => 'integer',
        ];
    }

    public function getIsCutAttribute(): bool
    {
        return $this->cut_after_phase !== null;
    }

    public function isActiveInPhase(int $phase): bool
    {
        return $this->cut_after_phase === null || $this->cut_after_phase >= $phase;
    }

    /**
     * Get the tournament that the player belongs to.
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Get the category of the player.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the group of the player.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_player')
            ->withTimestamps();
    }

    /**
     * Get the user account linked to the player.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the scores for the player.
     */
    public function scores(): HasMany
    {
        return $this->hasMany(Score::class);
    }

    /**
     * Get the payments for the player.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
