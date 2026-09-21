<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAmount extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'order_amounts';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'order_id',
        'subtotal_minor',
        'shipping_minor',
        'discount_minor',
        'tax_minor',
        'total_minor',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'order_id' => 'integer',
        'subtotal_minor' => 'integer',
        'shipping_minor' => 'integer',
        'discount_minor' => 'integer',
        'tax_minor' => 'integer',
        'total_minor' => 'integer',
    ];

    /**
     * Get the order that owns the amount.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the total in major units (divide by 100).
     */
    public function getSubtotalAttribute(): float
    {
        return $this->subtotal_minor / 100;
    }

    /**
     * Get the shipping cost in major units.
     */
    public function getShippingAttribute(): float
    {
        return $this->shipping_minor / 100;
    }

    /**
     * Get the discount in major units.
     */
    public function getDiscountAttribute(): float
    {
        return $this->discount_minor / 100;
    }

    /**
     * Get the tax amount in major units.
     */
    public function getTaxAttribute(): float
    {
        return $this->tax_minor / 100;
    }

    /**
     * Get the total in major units.
     */
    public function getTotalAttribute(): float
    {
        return $this->total_minor / 100;
    }
}
