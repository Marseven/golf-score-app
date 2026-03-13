<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Tournament extends Model
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
        'name',
        'date',
        'club',
        'status',
        'scoring_mode',
        'rules',
        'registration_open',
        'registration_fee',
        'registration_currency',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'registration_open' => 'boolean',
            'registration_fee' => 'decimal:2',
        ];
    }

    /**
     * Get the user who created the tournament.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the categories for the tournament.
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get the holes for the tournament, ordered by number.
     */
    public function holes(): HasMany
    {
        return $this->hasMany(Hole::class)->orderBy('number');
    }

    /**
     * Get the groups for the tournament.
     */
    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    /**
     * Get the players for the tournament.
     */
    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    /**
     * Get the scores for the tournament through players.
     */
    public function scores(): HasManyThrough
    {
        return $this->hasManyThrough(Score::class, Player::class);
    }

    /**
     * Get the payments for the tournament.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the user roles scoped to this tournament.
     */
    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }
}
