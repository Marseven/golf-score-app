<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
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
        'course_id',
        'name',
        'short_name',
        'color',
        'registration_fee',
        'handicap_coefficient',
        'max_phases',
    ];

    protected function casts(): array
    {
        return [
            'registration_fee' => 'decimal:2',
            'handicap_coefficient' => 'decimal:2',
            'max_phases' => 'integer',
        ];
    }

    /**
     * Get the tournament that the category belongs to.
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the players in this category.
     */
    public function players(): HasMany
    {
        return $this->hasMany(Player::class);
    }

    public function holes(): BelongsToMany
    {
        return $this->belongsToMany(Hole::class, 'category_hole')
            ->withPivot('par')
            ->withTimestamps();
    }
}
