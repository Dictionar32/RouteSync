<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string|null $image
 * @property string|null $image_url
 * @property string|null $category_name
 * @property float|null $rating
 * @property int|null $review_count
 */
class ProdukItem extends Model
{
    protected $fillable = [
        'nama',
        'deskripsi',
        'category_id',
        'currency_code',
        'harga',
        'harga_minor',
        'stok',
    ];

    protected $casts = [
        'category_id' => 'integer',
        'currency_code' => 'string',
        'harga' => 'integer',
        'harga_minor' => 'integer',
        'stok' => 'integer',
    ];

    protected $appends = ['image', 'image_url', 'category_name', 'rating', 'review_count'];

    public function orderDetails():HasMany{
        return $this->hasMany(OrderDetail::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function frontend(): HasOne
    {
        return $this->hasOne(ProdukItemFrontend::class);
    }

    public function wishlists():HasMany
    {
        return $this->hasMany(Wishlist::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }
}
