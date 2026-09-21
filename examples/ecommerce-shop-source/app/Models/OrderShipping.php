<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderShipping extends Model
{
    protected $fillable = [
        'order_id',
        'nama',
        'telepon',
        'alamat',
        'kota',
        'kode_pos',
        'courier_code',
        'service_level',
        'tracking_number',
        'estimated_arrival_at',
        'shipped_at',
        'delivered_at',
    ];

    protected $casts = [
        'estimated_arrival_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
