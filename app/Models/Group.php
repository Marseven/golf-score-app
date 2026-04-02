<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'course_id',
        'code',
        'tee_time',
        'marker_id',
        'marker_phone',
        'marker_token',
        'marker_pin',
        'tee_date',
        'hole_start',
        'hole_end',
        'scores_confirmed_at',
        'confirmed_by_name',
    ];

    protected function casts(): array
    {
        return [
            'phase' => 'integer',
            'hole_start' => 'integer',
            'hole_end' => 'integer',
            'tee_date' => 'date:Y-m-d',
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
                // Reuse existing PIN if this marker already has groups in this tournament
                if ($group->marker_id) {
                    $existingPin = static::where('tournament_id', $group->tournament_id)
                        ->where('marker_id', $group->marker_id)
                        ->whereNotNull('marker_pin')
                        ->value('marker_pin');
                    if ($existingPin) {
                        $group->marker_pin = $existingPin;
                        return;
                    }
                }
                $group->marker_pin = static::generateUniquePin($group->tournament_id);
            }
        });

        static::updating(function (Group $group) {
            // When marker changes, sync the PIN
            if ($group->isDirty('marker_id') && $group->marker_id) {
                $existingPin = static::where('tournament_id', $group->tournament_id)
                    ->where('marker_id', $group->marker_id)
                    ->where('id', '!=', $group->id)
                    ->whereNotNull('marker_pin')
                    ->value('marker_pin');
                if ($existingPin) {
                    $group->marker_pin = $existingPin;
                }
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
            // Ensure no other marker already uses this PIN in this tournament
        } while (static::where('tournament_id', $tournamentId)
            ->where('marker_pin', $pin)
            ->whereNotNull('marker_id')
            ->exists());

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
     * Get the markers assigned to this group (many-to-many).
     */
    public function markers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_marker')
            ->withPivot('marker_pin')
            ->withTimestamps();
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

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the marker (user) assigned to this group.
     */
    public function marker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marker_id');
    }
}
