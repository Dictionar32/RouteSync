<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderDetail extends Model
{
    protected $fillable = [
        'order_id',
        'produk_item_id',
        'qty',
        'harga',
    ];

    protected $casts = [
        'qty' => 'integer',
        'harga' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function produkItem(): BelongsTo
    {
        return $this->belongsTo(ProdukItem::class);
    }

    public function getFooAttribute()
    {
        return someCrazyRuntimeValue();
    }
}
