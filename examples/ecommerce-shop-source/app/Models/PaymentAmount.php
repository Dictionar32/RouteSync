<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAmount extends Model
{
    protected $fillable = [
        'payment_id',
        'currency_code',
        'amount_minor',
        'fee_minor',
        'net_amount_minor',
        'refund_amount_minor',
    ];

    protected $casts = [
        'currency_code' => 'string',
        'amount_minor' => 'integer',
        'fee_minor' => 'integer',
        'net_amount_minor' => 'integer',
        'refund_amount_minor' => 'integer',
    ];

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
