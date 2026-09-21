<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ProdukItem
 */
class ProdukItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $path = $this->frontend?->gambar;
        $imageUrl = $path ? asset('storage/' . ltrim($path, '/')) : null;
        $rating = (float) ($this->frontend?->rating ?? 0);
        $jumlahReview = (int) ($this->frontend?->jumlah_review ?? 0);

        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'deskripsi' => $this->deskripsi,
            'image' => $path,
            'image_url' => $imageUrl,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->nama,
            'harga' => $this->harga,
            'stok' => $this->stok,
            'rating' => $rating,
            'review_count' => $jumlahReview,
        ];
    }
}
