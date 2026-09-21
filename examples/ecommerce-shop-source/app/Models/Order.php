<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'total_harga',
        'status',
        'order_number'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
    ];

    /**
     * Get the user that owns the order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order details.
     */
    public function details(): HasMany
    {
        return $this->hasMany(OrderDetail::class);
    }

    /**
     * Get the payments for the order.
     */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Get the shipping address for the order.
     */
    public function shipping(): HasOne
    {
        return $this->hasOne(OrderShipping::class);
    }

    /**
     * Get the promotion for the order.
     */
    public function promotion(): HasOne
    {
        return $this->hasOne(OrderPromotion::class);
    }

    /**
     * Get the order amounts (monetary data).
     */
    public function amount(): HasOne
    {
        return $this->hasOne(OrderAmount::class);
    }

    /**
     * Get the order financial information.
     */
    public function financial(): HasOne
    {
        return $this->hasOne(OrderFinancial::class);
    }

    /**
     * Get the order fulfillment information.
     */
    public function fulfillment(): HasOne
    {
        return $this->hasOne(OrderFulfillment::class);
    }
}
