<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBuyNowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'produk_item_id' => 'required|integer|exists:produk_items,id',
            'qty' => 'required|integer|min:1',
            'shipping_nama' => 'nullable|string|max:255',
            'shipping_telepon' => 'nullable|string|max:40',
            'shipping_alamat' => 'nullable|string',
            'shipping_kota' => 'nullable|string|max:255',
            'shipping_kode_pos' => 'nullable|string|max:20',
        ];
    }
}
