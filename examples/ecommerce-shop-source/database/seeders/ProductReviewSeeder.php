<?php

namespace Database\Seeders;

use App\Models\OrderDetail;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run DatabaseSeeder first to create users.');
            return;
        }

        // Get order details for products that have been ordered
        $orderDetails = OrderDetail::whereHas('order', function ($query) {
            $query->where('status', 'paid');
        })->get();

        if ($orderDetails->isEmpty()) {
            $this->command->warn('No paid orders found. Please run OrderSeeder first.');
            return;
        }

        $reviews = [
            [
                'rating' => 5,
                'comment' => 'Produk ini luar biasa! Kualitasnya sangat bagus dan sesuai dengan foto.',
            ],
            [
                'rating' => 4,
                'comment' => 'Produk bagus, pengiriman cepat. Recommended!',
            ],
            [
                'rating' => 5,
                'comment' => 'Sangat puas dengan pembelian ini. Kualitas premium.',
            ],
            [
                'rating' => 3,
                'comment' => 'Produk ok, tapi pengiriman agak lama.',
            ],
            [
                'rating' => 4,
                'comment' => 'Bagus banget! Akan beli lagi.',
            ],
            [
                'rating' => 5,
                'comment' => 'Exceeded my expectations. Great product!',
            ],
            [
                'rating' => 2,
                'comment' => 'Kualitas kurang dari yang diharapkan.',
            ],
            [
                'rating' => 4,
                'comment' => 'Good value for money.',
            ],
        ];

        // Create reviews for random order details
        $randomOrderDetails = $orderDetails->random(min(5, $orderDetails->count()));
        
        foreach ($randomOrderDetails as $detail) {
            $review = $reviews[array_rand($reviews)];
            
            ProductReview::updateOrCreate(
                [
                    'user_id' => $detail->order->user_id,
                    'produk_item_id' => $detail->produk_item_id,
                ],
                [
                    'rating' => $review['rating'],
                    'comment' => $review['comment'],
                ]
            );
        }

        $this->command->info('ProductReviewSeeder completed successfully!');
    }
}
