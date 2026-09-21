<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    protected $fillable = [
        'code',
        'discount_type',
        'discount_value',
        'max_discount_minor',
        'min_order_minor',
        'usage_limit',
        'used_count',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'code' => 'string',
        'discount_type' => 'string',
        'discount_value' => 'integer',
        'max_discount_minor' => 'integer',
        'min_order_minor' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function orderPromotions(): HasMany
    {
        return $this->hasMany(OrderPromotion::class);
    }
}
