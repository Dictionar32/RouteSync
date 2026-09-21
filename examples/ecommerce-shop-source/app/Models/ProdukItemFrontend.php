<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProdukItemFrontend extends Model
{
    protected $fillable = [
        'produk_item_id',
        'gambar',
        'rating',
        'jumlah_review',
    ];

    protected $casts = [
        'rating' => 'float',
        'jumlah_review' => 'integer',
    ];

    public function produkItem(): BelongsTo
    {
        return $this->belongsTo(ProdukItem::class);
    }
}
