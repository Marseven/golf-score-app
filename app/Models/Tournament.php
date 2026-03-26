<?php

namespace App\Models;

use Carbon\Carbon;
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
        'start_date',
        'end_date',
        'club',
        'status',
        'scoring_mode',
        'rules',
        'registration_open',
        'registration_fee',
        'registration_currency',
        'cut_count',
        'cut_applied',
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
            'start_date' => 'date',
            'end_date' => 'date',
            'registration_open' => 'boolean',
            'registration_fee' => 'decimal:2',
            'cut_count' => 'integer',
            'cut_applied' => 'boolean',
        ];
    }

    /**
     * Compute the expected status based on today's date relative to start_date/end_date.
     *
     * Lifecycle: draft → published → active → finished
     * - draft: not visible publicly
     * - published: visible publicly, before start_date (registrations possible)
     * - active: tournament in progress (start_date reached)
     * - finished: tournament ended (end_date passed)
     */
    public function computeStatus(): string
    {
        if ($this->status === 'draft') {
            return 'draft';
        }

        $today = Carbon::today();
        $endDate = $this->end_date ?? $this->start_date;

        if ($today->gt($endDate)) {
            return 'finished';
        }

        if ($today->gte($this->start_date)) {
            return 'active';
        }

        return 'published';
    }

    /**
     * Sync the status column based on current dates if it has changed.
     */
    public function syncStatus(): bool
    {
        $computed = $this->computeStatus();

        if ($this->status !== $computed) {
            $this->status = $computed;

            return $this->saveQuietly();
        }

        return false;
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
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

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
