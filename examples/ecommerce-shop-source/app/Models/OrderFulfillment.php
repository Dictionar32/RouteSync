<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderFulfillment extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'order_fulfillments';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'order_id',
        'fulfillment_status',
        'processing_at',
        'shipped_at',
        'completed_at',
        'canceled_at',
        'cancel_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'order_id' => 'integer',
        'fulfillment_status' => 'string',
        'processing_at' => 'datetime',
        'shipped_at' => 'datetime',
        'completed_at' => 'datetime',
        'canceled_at' => 'datetime',
    ];

    /**
     * Valid fulfillment statuses.
     */
    public const STATUS_UNFULFILLED = 'unfulfilled';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_SHIPPED = 'shipped';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RETURNED = 'returned';

    /**
     * Get the order that owns the fulfillment information.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Check if the order is unfulfilled.
     */
    public function isUnfulfilled(): bool
    {
        return $this->fulfillment_status === self::STATUS_UNFULFILLED;
    }

    /**
     * Check if the order is being processed.
     */
    public function isProcessing(): bool
    {
        return $this->fulfillment_status === self::STATUS_PROCESSING;
    }

    /**
     * Check if the order has been shipped.
     */
    public function isShipped(): bool
    {
        return $this->fulfillment_status === self::STATUS_SHIPPED;
    }

    /**
     * Check if the order has been completed.
     */
    public function isCompleted(): bool
    {
        return $this->fulfillment_status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the order has been cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->fulfillment_status === self::STATUS_CANCELLED;
    }

    /**
     * Check if the order has been returned.
     */
    public function isReturned(): bool
    {
        return $this->fulfillment_status === self::STATUS_RETURNED;
    }

    /**
     * Check if the order is in a final state.
     */
    public function isFinal(): bool
    {
        return in_array($this->fulfillment_status, [
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_RETURNED
        ]);
    }
}
