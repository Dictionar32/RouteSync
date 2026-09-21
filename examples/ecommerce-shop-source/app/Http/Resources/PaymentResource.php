<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $promotion = $this->order?->promotion;
        $detail = $this->paymentDetail?->detail;
        $invoiceNumber = $this->order?->order_number ?? $this->order_id;
        $gateway = is_array($detail) ? ($detail['gateway'] ?? null) : null;

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'invoice_number' => $invoiceNumber,
            'metode' => $this->metode,
            'detail' => $detail,
            'status' => $this->status,
            'paid_at' => $this->paid_at,
            'provider' => $this->provider,
            'provider_txn_id' => $this->provider_txn_id,
            'gateway_status' => $this->gateway_status,
            'amount_minor' => $this->amount_minor,
            'refund_amount_minor' => $this->refund_amount_minor,
            'items' => OrderDetailResource::collection($this->order?->details),
            'promotion' => [
            'code' => $promotion?->promo_code,
            'discount_minor' => (int) ($promotion?->discount_minor ?? 0),
            ],
            'gateway' => [
                'name' => is_array($gateway) ? ($gateway['name'] ?? null) : null,
                'order_id' => is_array($gateway) ? ($gateway['order_id'] ?? null) : null,
                'token' => is_array($gateway) ? ($gateway['token'] ?? null) : null,
                'redirect_url' => is_array($gateway) ? ($gateway['redirect_url'] ?? null) : null,
            ],
            'total_harga' => $this->whenLoaded('order', fn () => $this->order->total_harga),
        ];
    }
}
