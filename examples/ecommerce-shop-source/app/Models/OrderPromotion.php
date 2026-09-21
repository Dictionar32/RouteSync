<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPromotion extends Model
{
    protected $fillable = [
        'order_id',
        'promo_code_id',
        'promo_code',
        'discount_minor',
        'metadata',
    ];

    protected $casts = [
        'promo_code' => 'string',
        'discount_minor' => 'integer',
        'metadata' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }
}
