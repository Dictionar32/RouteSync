<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGateway extends Model
{
    protected $fillable = [
        'payment_id',
        'provider',
        'provider_txn_id',
        'idempotency_key',
        'gateway_status',
        'gateway_code',
        'gateway_message',
        'authorized_at',
        'captured_at',
        'failed_at',
        'refunded_at',
        'reconciled_at',
        'reconciliation_batch_id',
    ];

    protected $casts = [
        'authorized_at' => 'datetime',
        'captured_at' => 'datetime',
        'failed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'reconciled_at' => 'datetime',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
