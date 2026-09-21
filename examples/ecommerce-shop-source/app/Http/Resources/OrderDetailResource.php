<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $produk = $this->produkItem;
        $path = $produk->frontend?->gambar;
        $imageUrl = $path ? asset('storage/' . ltrim($path, '/')) : null;

        return [
            'id' => $this->id,
            'produk_item_id' => $this->produk_item_id,
            'produk' => [
                'id' => $produk->id,
                'nama' => $produk->nama,
                'gambar' => $path,
                'image_url' => $imageUrl,
            ],
            'qty' => $this->qty,
            'harga' => $this->harga,
            'subtotal' => $this->qty * $this->harga,
        ];
    }
}
