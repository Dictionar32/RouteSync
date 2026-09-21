<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $shipping = $this->shipping;
        $promotion = $this->promotion;
        $financial = $this->financial;
        $fulfillment = $this->fulfillment;
        $amount = $this->amount;
        
        $subtotalMinor = $amount?->subtotal_minor ?? (int) ($this->subtotal_minor ?? $this->total_harga);
        $discountMinor = $amount?->discount_minor ?? (int) ($promotion?->discount_minor ?? 0);
        $shippingMinor = $amount?->shipping_minor ?? (int) ($this->shipping_minor ?? 0);
        $taxMinor = $amount?->tax_minor ?? (int) ($this->tax_minor ?? 0);
        $totalMinor = $amount?->total_minor ?? (int) ($this->total_harga_minor ?? $this->total_harga);

        return [
            'id' => $this->id,
            'status' => $this->status,
            'total_harga' => $this->total_harga,
            'invoice_number' => $this->order_number,
            'payment_status' => $this->payment?->status ?? 'pending',
            'financial_status' => $financial?->financial_status ?? 'pending',
            'fulfillment_status' => $fulfillment?->fulfillment_status ?? 'pending',
            'subtotal_minor' => $subtotalMinor,
            'discount_minor' => $discountMinor,
            'shipping_minor' => $shippingMinor,
            'tax_minor' => $taxMinor,
            'total_harga_minor' => $totalMinor,
            'items' => OrderDetailResource::collection($this->details),
            'promotion' => [
                'code' => $promotion?->promo_code,
                'discount_minor' => (int) ($promotion?->discount_minor ?? 0),
            ],
            'shipping' => [
                'nama' => $shipping?->nama,
                'telepon' => $shipping?->telepon,
                'alamat' => $shipping?->alamat,
                'kota' => $shipping?->kota,
                'kode_pos' => $shipping?->kode_pos,
            ],
            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
