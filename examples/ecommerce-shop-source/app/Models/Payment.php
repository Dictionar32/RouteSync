<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'metode',
        'status',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    public function paymentDetail(): HasOne
    {
    return $this->hasOne(PaymentDetail::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function paymentAmount(): HasMany
    {
        return $this->hasMany(PaymentAmount::class);
    }

    public function paymentGateways(): HasMany
    {
        return $this->hasMany(PaymentGateway::class);
    }

    // Test 1: Literal -> string
    protected function gatewayStatus(): Attribute
    {
        return Attribute::make(get: fn () => 'midtrans');
    }

    // Test 2: Cast -> number
    protected function amountMinor(): Attribute
    {
        return Attribute::make(get: fn () => (int) $this->id);
    }

    // Test 3: Function + Relation -> string
    protected function providerTxnId(): Attribute
    {
        return Attribute::make(get: fn () => strtoupper($this->paymentGateways->first()->provider));
    }

    // Test 4: Relation Column -> string (resolved via JS Graph)
    protected function provider(): Attribute
    {
        return Attribute::make(get: fn () => $this->paymentGateways->first()->provider);
    }

    // Test 5: Unknown relation -> unknown
    protected function refundAmountMinor(): Attribute
    {
        return Attribute::make(get: fn () => $this->unknownRelation->foo);
    }

    protected function foo(): Attribute
    {
        return Attribute::make(get: fn () => $this->bar);
    }

    protected function bar(): Attribute
    {
        return Attribute::make(get: fn () => $this->foo);
    }
}
