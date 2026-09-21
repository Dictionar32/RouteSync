<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // auth sudah di middleware
    }

    public function rules(): array
    {
        return [
            'items' => 'sometimes|array|min:1',
            'items.*.produk_item_id' => 'required_with:items|integer|exists:produk_items,id',
            'items.*.qty' => 'required_with:items|integer|min:1',
            'shipping_nama' => 'nullable|string|max:255',
            'shipping_telepon' => 'nullable|string|max:40',
            'shipping_alamat' => 'nullable|string',
            'shipping_kota' => 'nullable|string|max:255',
            'shipping_kode_pos' => 'nullable|string|max:20',
        ];
    }
}
