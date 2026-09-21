<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\ProdukItem;
use App\Models\ProdukItemFrontend;
use Illuminate\Database\Seeder;

class ProdukItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'nama' => 'Apple AirPods Pro',
                'deskripsi' => 'Earbuds premium dengan active noise cancellation.',
                'gambar' => 'produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg',
                'kategori' => 'Audio',
                'harga' => 3499000,
                'stok' => 20,
                'rating' => 4.8,
                'jumlah_review' => 125,
            ],
            [
                'nama' => 'Samsung Galaxy S22',
                'deskripsi' => 'Smartphone flagship dengan kamera tajam dan performa cepat.',
                'gambar' => 'produk/ChatGPT Image 15 Feb 2026, 10.21.58.png',
                'kategori' => 'Smartphone',
                'harga' => 11999000,
                'stok' => 15,
                'rating' => 4.6,
                'jumlah_review' => 99,
            ],
            [
                'nama' => 'Apple Watch Series 7',
                'deskripsi' => 'Smartwatch untuk kesehatan, kebugaran, dan notifikasi harian.',
                'gambar' => 'produk/ChatGPT Image 15 Feb 2026, 10.26.06.png',
                'kategori' => 'Wearable',
                'harga' => 7999000,
                'stok' => 12,
                'rating' => 4.7,
                'jumlah_review' => 1440,
            ],
            [
                'nama' => 'Sony WH-1000XM4',
                'deskripsi' => 'Headphone noise cancelling dengan kualitas audio tinggi.',
                'gambar' => 'produk/ChatGPT Image 15 Feb 2026, 10.28.27.png',
                'kategori' => 'Audio',
                'harga' => 4999000,
                'stok' => 18,
                'rating' => 4.8,
                'jumlah_review' => 95,
            ],
            [
                'nama' => 'MacBook Air M1',
                'deskripsi' => 'Laptop tipis dengan performa efisien untuk kerja dan belajar.',
                'gambar' => 'produk/WhatsApp Image 2026-02-15 at 10.17.08.jpeg',
                'kategori' => 'Laptop',
                'harga' => 15999000,
                'stok' => 8,
                'rating' => 4.9,
                'jumlah_review' => 112,
            ],
            [
                'nama' => 'Xiaomi Mi Band 6',
                'deskripsi' => 'Smart band ringan dengan fitur monitor kebugaran lengkap.',
                'gambar' => 'produk/WhatsApp Image 2026-02-15 at 10.17.08 (1).jpeg',
                'kategori' => 'Wearable',
                'harga' => 499000,
                'stok' => 30,
                'rating' => 4.5,
                'jumlah_review' => 220,
            ],
            [
                'nama' => 'Sony WH-1000XM4 BLACK',
                'deskripsi' => 'Varian hitam headphone Sony dengan ANC premium.',
                'gambar' => 'produk/ChatGPT Image 15 Feb 2026, 10.28.31.png',
                'kategori' => 'Audio',
                'harga' => 15999000,
                'stok' => 9,
                'rating' => 4.7,
                'jumlah_review' => 66,
            ],
            [
                'nama' => 'JBL Flip 5',
                'deskripsi' => 'Speaker bluetooth portabel tahan air dengan suara bertenaga.',
                'gambar' => 'produk/WhatsApp Image 2026-02-15 at 10.17.08 (2).jpeg',
                'kategori' => 'Audio',
                'harga' => 1699000,
                'stok' => 25,
                'rating' => 4.6,
                'jumlah_review' => 105,
            ],
            [
                'nama' => 'Earbuds Wireless Lite',
                'deskripsi' => 'Earbuds harian dengan desain ringan dan koneksi stabil.',
                'gambar' => 'produk/ChatGPT Image 15 Feb 2026, 10.29.15.png',
                'kategori' => 'Audio',
                'harga' => 1299000,
                'stok' => 35,
                'rating' => 4.3,
                'jumlah_review' => 52,
            ],
        ];

        $kategoriNames = collect($items)
            ->pluck('kategori')
            ->unique()
            ->values();

        $kategoriMap = [];

        foreach ($kategoriNames as $kategoriName) {
            $kategori = Category::firstOrCreate([
                'nama' => $kategoriName,
            ]);

            $kategoriMap[$kategoriName] = $kategori->id;
        }

        foreach ($items as $item) {
            $kategoriId = $kategoriMap[$item['kategori']] ?? null;
            $frontendData = [
                'gambar' => $item['gambar'] ?? null,
                'rating' => $item['rating'] ?? 0,
                'jumlah_review' => $item['jumlah_review'] ?? 0,
            ];

            unset($item['kategori']);
            unset($item['gambar'], $item['rating'], $item['jumlah_review']);
            $item['category_id'] = $kategoriId;

            $produk = ProdukItem::updateOrCreate(
                ['nama' => $item['nama']],
                $item
            );

            ProdukItemFrontend::updateOrCreate(
                ['produk_item_id' => $produk->id],
                $frontendData
            );
        }
    }
}
