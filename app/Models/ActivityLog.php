<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;

class ActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'type',
        'action',
        'route_name',
        'method',
        'url',
        'user_id',
        'user_name',
        'user_role',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(string $type, string $action, ?Request $request = null, array $metadata = []): self
    {
        $request = $request ?? request();
        $user = $request->user();

        return static::create([
            'type' => $type,
            'action' => $action,
            'route_name' => $request->route()?->getName(),
            'method' => $request->method(),
            'url' => substr($request->fullUrl(), 0, 500),
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? session('marker_group_code') ?? session('caddie_master_tournament_id') ? 'Caddie Master' : null,
            'user_role' => $user ? $user->roles->pluck('role')->first() : (session('marker_group_id') ? 'marker' : (session('caddie_master_tournament_id') ? 'caddie-master' : null)),
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500),
            'metadata' => !empty($metadata) ? $metadata : null,
            'created_at' => now(),
        ]);
    }
}
