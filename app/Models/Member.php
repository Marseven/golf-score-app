<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'member_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'handicap_index',
        'category_type',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'handicap_index' => 'decimal:1',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Member $member) {
            if (empty($member->member_code)) {
                $member->member_code = static::generateUniqueMemberCode();
            }
        });

        static::saving(function (Member $member) {
            $member->category_type = $member->handicap_index < 7 ? 'professional' : 'amateur';
        });
    }

    public static function generateUniqueMemberCode(): string
    {
        do {
            $code = 'MGC-'.str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (static::where('member_code', $code)->exists());

        return $code;
    }

    public function getFullNameAttribute(): string
    {
        return $this->first_name.' '.$this->last_name;
    }
}
