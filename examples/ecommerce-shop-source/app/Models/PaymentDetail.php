<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentDetail extends Model
{
    protected $fillable = [
        'payment_id',
        'detail',
        'payload_hash',
        'payload_received_at',
    ];

    protected $casts = [
        'detail' => 'array',
        'payload_hash' => 'string',
        'payload_received_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
