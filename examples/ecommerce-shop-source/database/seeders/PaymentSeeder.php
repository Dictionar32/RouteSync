<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAmount;
use App\Models\PaymentDetail;
use App\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $orders = Order::where('status', '!=', 'pending')->get();
        
        if ($orders->isEmpty()) {
            $this->command->warn('No orders found. Please run OrderSeeder first.');
            return;
        }

        foreach ($orders as $order) {
            // Create payment
            $payment = Payment::create([
                'order_id' => $order->id,
                'metode' => $this->getRandomPaymentMethod(),
                'status' => $order->status === 'paid' ? 'success' : 'failed',
                'paid_at' => $order->status === 'paid' ? now() : null,
            ]);

            // Create payment amount
            PaymentAmount::create([
                'payment_id' => $payment->id,
                'currency_code' => 'IDR',
                'amount_minor' => $order->total_harga * 100,
                'fee_minor' => 0,
                'net_amount_minor' => $order->total_harga * 100,
                'refund_amount_minor' => 0,
            ]);

            // Create payment detail
            PaymentDetail::create([
                'payment_id' => $payment->id,
                'detail' => json_encode([
                    'transaction_id' => 'TXN-' . strtoupper(uniqid()),
                    'payment_method' => $payment->metode,
                    'customer_info' => [
                        'name' => $order->user->name ?? 'Customer',
                        'email' => $order->user->email ?? 'customer@example.com',
                    ],
                ]),
            ]);

            // Create payment gateway
            PaymentGateway::create([
                'payment_id' => $payment->id,
                'provider' => $this->getRandomProvider(),
                'provider_txn_id' => 'PROV-' . strtoupper(uniqid()),
                'idempotency_key' => 'IDEM-' . strtoupper(uniqid()),
                'gateway_status' => $payment->status === 'success' ? 'captured' : 'failed',
                'gateway_code' => $payment->status === 'success' ? '200' : '500',
                'gateway_message' => $payment->status === 'success' ? 'Payment successful' : 'Payment failed',
                'authorized_at' => $payment->status === 'success' ? now() : null,
                'captured_at' => $payment->status === 'success' ? now() : null,
                'failed_at' => $payment->status !== 'success' ? now() : null,
            ]);
        }

        $this->command->info('PaymentSeeder completed successfully!');
    }

    private function getRandomPaymentMethod(): string
    {
        $methods = ['credit_card', 'bank_transfer', 'e_wallet', 'ovo', 'gopay', 'dana'];
        return $methods[array_rand($methods)];
    }

    private function getRandomProvider(): string
    {
        $providers = ['midtrans', 'xendit', 'stripe', 'paypal'];
        return $providers[array_rand($providers)];
    }
}
