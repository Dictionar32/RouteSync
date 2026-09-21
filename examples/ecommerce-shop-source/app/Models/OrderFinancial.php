<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderFinancial extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'order_financials';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'order_id',
        'financial_status',
        'refunded_at',
        'refund_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'order_id' => 'integer',
        'financial_status' => 'string',
        'refunded_at' => 'datetime',
    ];

    /**
     * Valid financial statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_PARTIALLY_REFUNDED = 'partially_refunded';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the order that owns the financial information.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Check if the order is paid.
     */
    public function isPaid(): bool
    {
        return $this->financial_status === self::STATUS_PAID;
    }

    /**
     * Check if the order is refunded.
     */
    public function isRefunded(): bool
    {
        return in_array($this->financial_status, [self::STATUS_REFUNDED, self::STATUS_PARTIALLY_REFUNDED]);
    }

    /**
     * Check if the order payment has failed.
     */
    public function isFailed(): bool
    {
        return $this->financial_status === self::STATUS_FAILED;
    }

    /**
     * Check if the order is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->financial_status === self::STATUS_CANCELLED;
    }
}
