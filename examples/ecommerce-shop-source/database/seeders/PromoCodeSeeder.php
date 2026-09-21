<?php

namespace Database\Seeders;

use App\Models\PromoCode;
use Illuminate\Database\Seeder;

class PromoCodeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        PromoCode::updateOrCreate(
            ['code' => 'HEMAT50K'],
            [
                'discount_type' => 'fixed_minor',
                'discount_value' => 50000,
                'min_order_minor' => 300000,
                'usage_limit' => 10000,
                'is_active' => true,
                'starts_at' => $now->copy()->subDay(),
                'ends_at' => $now->copy()->addMonths(3),
            ]
        );

        PromoCode::updateOrCreate(
            ['code' => 'DISKON10'],
            [
                'discount_type' => 'percent',
                'discount_value' => 10,
                'max_discount_minor' => 200000,
                'min_order_minor' => 500000,
                'usage_limit' => 50000,
                'is_active' => true,
                'starts_at' => $now->copy()->subDay(),
                'ends_at' => $now->copy()->addMonths(3),
            ]
        );
    }
}
