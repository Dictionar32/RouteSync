<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\OrderAmount;
use App\Models\OrderFinancial;
use App\Models\OrderFulfillment;
use App\Models\OrderPromotion;
use App\Models\OrderShipping;
use App\Models\ProdukItem;
use App\Models\PromoCode;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
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

        $produkItems = ProdukItem::all();
        
        if ($produkItems->isEmpty()) {
            $this->command->warn('No produk items found. Please run ProdukItemSeeder first.');
            return;
        }

        $promoCodes = PromoCode::all();

        // Create sample orders with different statuses
        $orderData = [
            [
                'user' => $users->first(),
                'status' => 'pending',
                'financial_status' => 'pending',
                'fulfillment_status' => 'unfulfilled',
                'items' => [
                    ['produk' => $produkItems->random(), 'qty' => 1],
                    ['produk' => $produkItems->random(), 'qty' => 2],
                ],
                'shipping_cost' => 15000,
                'promo_code' => $promoCodes->random() ?? null,
            ],
            [
                'user' => $users->first(),
                'status' => 'paid',
                'financial_status' => 'paid',
                'fulfillment_status' => 'processing',
                'items' => [
                    ['produk' => $produkItems->random(), 'qty' => 1],
                ],
                'shipping_cost' => 20000,
                'promo_code' => null,
            ],
            [
                'user' => $users->first(),
                'status' => 'paid',
                'financial_status' => 'paid',
                'fulfillment_status' => 'shipped',
                'items' => [
                    ['produk' => $produkItems->random(), 'qty' => 3],
                    ['produk' => $produkItems->random(), 'qty' => 1],
                ],
                'shipping_cost' => 25000,
                'promo_code' => $promoCodes->random() ?? null,
            ],
            [
                'user' => $users->first(),
                'status' => 'paid',
                'financial_status' => 'paid',
                'fulfillment_status' => 'completed',
                'items' => [
                    ['produk' => $produkItems->random(), 'qty' => 2],
                ],
                'shipping_cost' => 15000,
                'promo_code' => null,
            ],
            [
                'user' => $users->first(),
                'status' => 'canceled',
                'financial_status' => 'refunded',
                'fulfillment_status' => 'cancelled',
                'items' => [
                    ['produk' => $produkItems->random(), 'qty' => 1],
                ],
                'shipping_cost' => 10000,
                'promo_code' => null,
            ],
        ];

        foreach ($orderData as $data) {
            $user = $data['user'];
            $items = $data['items'];
            $shippingCost = $data['shipping_cost'];
            $promoCode = $data['promo_code'];

            // Calculate totals
            $subtotal = 0;
            $orderDetails = [];
            
            foreach ($items as $item) {
                $itemTotal = $item['produk']->harga * $item['qty'];
                $subtotal += $itemTotal;
                
                $orderDetails[] = [
                    'produk_item_id' => $item['produk']->id,
                    'qty' => $item['qty'],
                    'harga' => $item['produk']->harga,
                ];
            }

            $discount = 0;
            if ($promoCode) {
                if ($promoCode->discount_type === 'fixed_minor') {
                    $discount = $promoCode->discount_value;
                } else {
                    $discount = (int) ($subtotal * $promoCode->discount_value / 100);
                    if ($promoCode->max_discount_minor && $discount > $promoCode->max_discount_minor) {
                        $discount = $promoCode->max_discount_minor;
                    }
                }
            }

            $total = $subtotal + $shippingCost - $discount;
            $totalMinor = $total * 100;
            $subtotalMinor = $subtotal * 100;
            $shippingMinor = $shippingCost * 100;
            $discountMinor = $discount * 100;

            // Create order
            $order = Order::create([
                'user_id' => $user->id,
                'total_harga' => $total,
                'status' => $data['status'],
            ]);

            // Create order details
            foreach ($orderDetails as $detail) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'produk_item_id' => $detail['produk_item_id'],
                    'qty' => $detail['qty'],
                    'harga' => $detail['harga'],
                ]);
            }

            // Create order amounts
            OrderAmount::create([
                'order_id' => $order->id,
                'subtotal_minor' => $subtotalMinor,
                'shipping_minor' => $shippingMinor,
                'discount_minor' => $discountMinor,
                'tax_minor' => 0,
                'total_minor' => $totalMinor,
            ]);

            // Create order financials
            OrderFinancial::create([
                'order_id' => $order->id,
                'financial_status' => $data['financial_status'],
            ]);

            // Create order fulfillment
            OrderFulfillment::create([
                'order_id' => $order->id,
                'fulfillment_status' => $data['fulfillment_status'],
            ]);

            // Create order shipping
            OrderShipping::create([
                'order_id' => $order->id,
                'nama' => $user->name,
                'telepon' => '081234567890',
                'alamat' => 'Jl. Contoh No. 123',
                'kota' => 'Jakarta',
                'kode_pos' => '12345',
            ]);

            // Create order promotion if promo code was used
            if ($promoCode) {
                OrderPromotion::create([
                    'order_id' => $order->id,
                    'promo_code_id' => $promoCode->id,
                    'promo_code' => $promoCode->code,
                    'discount_minor' => $discountMinor,
                ]);
            }
        }

        $this->command->info('OrderSeeder completed successfully!');
    }
}
