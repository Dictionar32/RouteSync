<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReview extends Model
{
    protected $fillable = [
        'produk_item_id',
        'user_id',
        'rating',
        'title',
        'comment',
        'is_verified_purchase',
    ];

    protected $casts = [
        'rating' => 'integer',
        'title' => 'string',
        'comment' => 'string',
        'is_verified_purchase' => 'boolean',
    ];

    public function produkItem(): BelongsTo
    {
        return $this->belongsTo(ProdukItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
