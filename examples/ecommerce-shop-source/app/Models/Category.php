<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'nama',
    ];

    public function produkItems(): HasMany
    {
        return $this->hasMany(ProdukItem::class);
    }
}
