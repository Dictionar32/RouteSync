<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\OrderPromotion;
use App\Models\PromoCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Attributes\Response;

class PromoController extends Controller
{
    #[Response(Order::class)]
    public function apply(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:64',
        ]);

        return DB::transaction(function () use ($request) {
            $order = Order::where('user_id', $request->user()->id)
                ->where('status', 'pending')
                ->with(['details', 'promotion.promoCode', 'shipping', 'payment'])
                ->lockForUpdate()
                ->latest()
                ->first();

            if (! $order || $order->details->isEmpty()) {
                abort(422, 'Keranjang kosong');
            }

            $code = strtoupper($request->string('code')->toString());
            $promo = PromoCode::where('code', $code)->lockForUpdate()->first();

            if (! $promo || ! $this->isPromoActive($promo)) {
                abort(422, 'Kode promo tidak valid atau tidak aktif');
            }

            $subtotal = (int) $order->details()
                ->selectRaw('COALESCE(SUM(qty * harga), 0) as subtotal')
                ->value('subtotal');

            if ($subtotal <= 0) {
                abort(422, 'Subtotal order tidak valid');
            }

            if ($subtotal < (int) $promo->min_order_minor) {
                abort(422, 'Minimum belanja untuk promo ini belum terpenuhi');
            }

            $usedCount = OrderPromotion::where('promo_code_id', $promo->id)
                ->whereHas('order', function ($query) {
                    $query->where('status', 'paid');
                })
                ->count();

            if ($promo->usage_limit !== null && $usedCount >= $promo->usage_limit) {
                abort(422, 'Kuota promo sudah habis');
            }

            $discount = $this->calculateDiscount($promo, $subtotal);

            $order->promotion()->updateOrCreate(
                ['order_id' => $order->id],
                [
                    'promo_code_id' => $promo->id,
                    'promo_code' => $promo->code,
                    'discount_minor' => $discount,
                    'metadata' => [
                        'discount_type' => $promo->discount_type,
                        'discount_value' => $promo->discount_value,
                    ],
                ]
            );

            $this->updateOrderTotals($order, $subtotal, $discount);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping', 'promotion.promoCode']));
        });
    }

    #[Response(Order::class)]
    public function remove(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $order = Order::where('user_id', $request->user()->id)
                ->where('status', 'pending')
                ->with(['details', 'promotion', 'shipping', 'payment'])
                ->lockForUpdate()
                ->latest()
                ->first();

        if (! $order) {
            abort(404, 'Keranjang tidak ditemukan');
        }

        if (! $order->promotion) {
            abort(422, 'Tidak ada promo yang diterapkan');
        }

        $order->promotion()->delete();

            $subtotal = (int) $order->details()
                ->selectRaw('COALESCE(SUM(qty * harga), 0) as subtotal')
                ->value('subtotal');

            $this->updateOrderTotals($order, $subtotal, 0);

            return new OrderResource($order->load(['details.produkItem.frontend', 'payment', 'shipping']));
        });
    }

    private function isPromoActive(PromoCode $promo): bool
    {
        if (! $promo->is_active) {
            return false;
        }

        $now = now();

        if ($promo->starts_at && $promo->starts_at->gt($now)) {
            return false;
        }

        if ($promo->ends_at && $promo->ends_at->lt($now)) {
            return false;
        }

        return true;
    }

    private function calculateDiscount(PromoCode $promo, int $subtotal): int
    {
        if ($promo->discount_type === 'fixed_minor') {
            return min((int) $promo->discount_value, $subtotal);
        }

        $raw = (int) floor($subtotal * ((float) $promo->discount_value / 100));
        $discount = min($raw, $subtotal);

        if ($promo->max_discount_minor !== null) {
            $discount = min($discount, (int) $promo->max_discount_minor);
        }

        return $discount;
    }

    private function updateOrderTotals(Order $order, int $subtotal, int $discount): void
    {
        $discount = min(max(0, $discount), max(0, $subtotal));
        $shipping = (int) ($order->shipping_minor ?? 0);
        $tax = (int) ($order->tax_minor ?? 0);

        $grandTotal = max(0, $subtotal - $discount + $shipping + $tax);

        $order->update([
            'subtotal_minor' => $subtotal,
            'discount_minor' => $discount,
            'total_harga_minor' => $grandTotal,
            'total_harga' => $grandTotal,
        ]);
    }
}
